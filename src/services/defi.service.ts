import { Injectable, Logger } from '@nestjs/common';
import { ChainId, Token, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Pair, Percent } from '@uniswap/sdk'
import { AddressMapping } from 'src/models/address.mapping.entity';
import { Config } from './config.service';
import { EthereumTokensService } from './ethereum-tokens.service';
import Web3 from 'web3';
import { SwapTokenRequestObject } from 'src/models/request.objects/swap.token.ro';
import { User } from 'src/models/user.entity';
import { UserService } from './user.service';
import { WALLET_TYPE } from 'src/utils/enums';
import { Transaction, TxData } from 'ethereumjs-tx';
import { AES, enc } from 'crypto-js';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { UniswapToken } from 'src/models/uniswap.token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EthereumService } from './ethereum.service';

@Injectable()
export class DefiService {
    private readonly logger = new Logger(DefiService.name);
    private chainId: number;
    private uniswapRouterContract: string;
    private web3: Web3;
    private uniswapRouter02Abi;
    private uniswapRouter02Address;
    private httpService: HttpClient;

    @InjectRepository(UniswapToken) private uniswapTokenRepo: Repository<UniswapToken>;

    constructor(
        private ethereumTokensService: EthereumTokensService,
        private ethereumService: EthereumService,
        private config: Config,
        private userService: UserService,
    ) {
        this.logger.debug(`The chainId of mainnet is ${ChainId.MAINNET}.`)
        this.chainId = ChainId.MAINNET;
        this.web3 = new Web3(this.config.p["ethereum.server.url"]);
        this.uniswapRouter02Abi = this.config.uniswapRouter02Abi;
        this.uniswapRouter02Address = this.config.p['uniswap.router.contract'];
        this.httpService = new HttpClient('Defi API');
    }

    // async getToken(fromAddress: string, toAddress: string) {

    //     fromAddress = this.web3.utils.toChecksumAddress(fromAddress);
    //     toAddress = this.web3.utils.toChecksumAddress(toAddress);

    //     const fromToken: Token = await Fetcher.fetchTokenData(this.chainId, fromAddress); //usdt
    //     const toToken: Token = await Fetcher.fetchTokenData(this.chainId, toAddress); // link

    //     // let currentProvider = new this.web3.providers.HttpProvider('http://localhost:8545');
    //     // let web3Provider = new Web3Provider(currentProvider);

    //     const pair = await Fetcher.fetchPairData(fromToken, toToken);
    //     const route = new Route([pair], fromToken, toToken);
    //     this.logger.debug(`Mid Price: ${route.midPrice.toSignificant(6)}`); // 201.306
    //     this.logger.debug(`Inverted Mid Proce: ${route.midPrice.invert().toSignificant(6)}`); // 0.00496756        
    //     const trade = new Trade(route, new TokenAmount(toToken, '1000000000000000000'), TradeType.EXACT_OUTPUT);
    //     console.log(trade.executionPrice.toSignificant(6))
    //     console.log(trade.nextMidPrice.toSignificant(6))
    // }

    async addToDB(token) {
        const dbToken = await this.uniswapTokenRepo.createQueryBuilder("uniswapToken")
            .where("chain_id = :cid", { cid: token.chainId })
            .andWhere("address = :add", { add: token.address })
            .andWhere("name = :name", { name: token.name })
            .andWhere("symbol = :sym", { sym: token.symbol })
            .getOne();

        if (dbToken === undefined) {
            this.uniswapTokenRepo.save(token);
        }
    }

    async getAllTokens(reload: boolean): Promise<UniswapToken[]> {
        return new Promise(async (resolve, reject) => {
            try {
                if (reload) {
                    const url = this.config.p['uniswap.tokens.list.url'];
                    this.logger.debug("URL: " + url);
                    const res = await this.httpService.get(url);
                    const uniswapTokens: UniswapToken[] = [];
                    if (res.message.statusCode === 200) {
                        const body = await res.readBody();
                        const parsed = JSON.parse(body);
                        const tokens: any[] = parsed.tokens;
                        for (let x of tokens) {
                            const token: UniswapToken = {
                                chainId: x.chainId,
                                address: x.address,
                                decimals: x.decimals,
                                name: x.name,
                                symbol: x.symbol,
                                logoURI: x.logoURI
                            }

                            this.addToDB(token);

                            uniswapTokens.push(token);
                        }
                        resolve(uniswapTokens)
                    } else {
                        resolve([]);
                    }
                } else {
                    const dbTokens = await this.uniswapTokenRepo.find();
                    resolve(dbTokens);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async swap(stro: SwapTokenRequestObject) {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService.loginNoHash(stro.emailAddress, stro.password);
                const sender: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === WALLET_TYPE.ETH
                });
                const fromAddress = stro.fromAddress;
                const toAddress = stro.toAddress;
                let result = "";
                if (fromAddress === "0x0000000000000000000000000000000000000000" && toAddress === "0x0000000000000000000000000000000000000000") {
                    reject("You can't swap from ether to ether");
                } else if (fromAddress === toAddress) {
                    reject("You can't swap from a token to itself");
                } else if (stro.fromAddress === "0x0000000000000000000000000000000000000000") {
                    const toToken: Token = await Fetcher.fetchTokenData(this.chainId, this.web3.utils.toChecksumAddress(toAddress));
                    result = await this.swapEtherForToken(sender, toToken, stro.amountIn);
                } else if (stro.toAddress === "0x0000000000000000000000000000000000000000") {
                    const fromToken: Token = await Fetcher.fetchTokenData(this.chainId, this.web3.utils.toChecksumAddress(fromAddress));
                    result = await this.swapTokenForEther(sender, fromToken, stro.amountIn);
                } else {
                    const fromToken: Token = await Fetcher.fetchTokenData(this.chainId, this.web3.utils.toChecksumAddress(fromAddress));
                    const toToken: Token = await Fetcher.fetchTokenData(this.chainId, this.web3.utils.toChecksumAddress(toAddress));
                    result = await this.swapTokenForToken(sender, fromToken, toToken, stro.amountIn, METHOD.TOKEN_FOR_TOKEN);
                }
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async swapTokenForToken(sender: AddressMapping, fromToken: Token, toToken: Token, amountIn: number, method: METHOD): Promise<string> {
        // 1. Check that sender have enough fromAddress tokens        
        if (method === METHOD.ETHER_FOR_TOKEN) {
            const balance: number = await this.ethereumService.getBalance(sender.chainAddress);
            if (balance < amountIn) {
                throw Error(`You don't have enough Ether to complete this transaction`);
            }            
        } else {
            sender.fees.decimals = fromToken.decimals;
            sender.fees.contractAddress = fromToken.address;
            const balance: number = await this.ethereumTokensService.getBalance(sender);
            if (balance < amountIn) {
                const uniswapToken: UniswapToken = await this.uniswapTokenRepo.createQueryBuilder("uniswapToken")
                            .where("address = :add", {add: fromToken.address})
                            .getOne();
                throw Error(`You don't have enough ${uniswapToken.symbol} to complete this transaction`);
            }
        }

        // 2. Approve Uniswap Router to spend amountIn on fromToken
        const txHash = await this.ethereumTokensService.approve(sender, this.uniswapRouterContract, amountIn);

        // 3. Swap token using Uniswap Router and Trade

        const pair: Pair = await Fetcher.fetchPairData(fromToken, toToken);
        const route: Route = new Route([pair], toToken);
        const amountInIsh: string = Math.round(amountIn * (10 ** fromToken.decimals)) + "";
        const trade: Trade = new Trade(route, new TokenAmount(toToken, amountInIsh), TradeType.EXACT_INPUT)
        const slippageTolerance: Percent = new Percent('50', '10000') // 50 bips, or 0.50%
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex

        const nonce: number = await this.web3.eth.getTransactionCount(sender.chainAddress);
        const contract = new this.web3.eth.Contract(this.uniswapRouter02Abi, this.uniswapRouter02Address, { from: sender.chainAddress });

        const block = await this.web3.eth.getBlock("latest");
        var rawTransaction: TxData = {
            gasPrice: this.web3.utils.toHex(0),
            gasLimit: this.web3.utils.toHex(block.gasLimit),
            to: sender.fees.contractAddress,
            value: "0x0",
            //data: contract.methods.transfer(recipient, amountHex).encodeABI(),
            nonce: this.web3.utils.toHex(nonce),
        }

        const path: string[] = [];
        path.push(fromToken.address);
        path.push(toToken.address);
        const thirtyMinutes = Math.round((new Date().getTime() + (30 * 60 * 1000)) / 1000);

        switch (method) {
            case METHOD.ETHER_FOR_TOKEN:
                rawTransaction.data = contract.methods.swapExactETHForTokens(amountOutMin, path, sender.chainAddress, thirtyMinutes).encodeABI()
                break;
            case METHOD.TOKEN_FOR_ETHER:
                rawTransaction.data = contract.methods.swapExactTokensForETH(+amountInIsh, amountOutMin, path, sender.chainAddress, thirtyMinutes).encodeABI()
                break;
            case METHOD.TOKEN_FOR_TOKEN:
                rawTransaction.data = contract.methods.swapExactTokensForTokens(+amountInIsh, amountOutMin, path, sender.chainAddress, thirtyMinutes).encodeABI()
                break;
        }

        const transaction = new Transaction(rawTransaction);
        const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
        transaction.sign(pk);
        const reciept = await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))

        return reciept.transactionHash;
    }

    async swapTokenForEther(sender: AddressMapping, fromToken: Token, amountIn: number): Promise<string> {
        const toToken: Token = WETH[this.chainId];
        return await this.swapTokenForToken(sender, fromToken, toToken, amountIn, METHOD.TOKEN_FOR_ETHER);
    }

    async swapEtherForToken(sender: AddressMapping, toToken: Token, amountIn: number): Promise<string> {
        const fromToken: Token = WETH[this.chainId];
        return await this.swapTokenForToken(sender, fromToken, toToken, amountIn, METHOD.ETHER_FOR_TOKEN);
    }
}


export enum METHOD {
    TOKEN_FOR_TOKEN,
    TOKEN_FOR_ETHER,
    ETHER_FOR_TOKEN
};