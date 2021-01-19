import { Injectable, Logger } from '@nestjs/common';
import { ChainId, Token, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Pair, Percent } from '@uniswap/sdk'
import { AddressMapping } from 'src/models/address.mapping.entity';
import { Config } from './config.service';
import { EthereumTokensService } from './ethereum-tokens.service';
import Web3 from 'web3';
import { SwapTokenRequestObject } from 'src/models/request.objects/swap.token.ro';
import { User } from 'src/models/user.entity';
import { UserService } from './user.service';
import { Transaction, TxData } from 'ethereumjs-tx';
import { AES, enc } from 'crypto-js';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { UniswapToken } from 'src/models/uniswap.token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EthereumService } from './ethereum.service';
import { UserToken } from 'src/models/user.tokens.entity';

@Injectable()
export class DefiService {
    private readonly logger = new Logger(DefiService.name);
    private chainId: number;
    private web3: Web3;
    private uniswapRouter02Abi;
    private uniswapRouter02Address;
    private httpService: HttpClient;

    @InjectRepository(UniswapToken) private uniswapTokenRepo: Repository<UniswapToken>;
    @InjectRepository(UserToken) private userTokenRepo: Repository<UserToken>;

    constructor(
        private ethereumTokensService: EthereumTokensService,
        private config: Config,
        private userService: UserService,
        private ethereumService: EthereumService,
    ) {
        this.chainId = ChainId.MAINNET;

        this.web3 = new Web3(this.config.p["ethereum.server.url"]);
        this.uniswapRouter02Abi = this.config.uniswapRouter02Abi;
        this.uniswapRouter02Address = this.config.p['uniswap.router.contract'];
        this.httpService = new HttpClient('Defi API');
    }

    async getPrice(fromAddress: string, toAddress: string): Promise<string> {
        const weth = WETH[this.chainId];
        if (fromAddress === "0x") {
            fromAddress = weth.address;
        }

        if (toAddress === "0x") {
            toAddress = weth.address;
        }

        return new Promise(async (resolve, reject) => {
            try {
                fromAddress = this.web3.utils.toChecksumAddress(fromAddress);
                toAddress = this.web3.utils.toChecksumAddress(toAddress);
                const fromToken: Token = await Fetcher.fetchTokenData(this.chainId, fromAddress); //usdt
                const toToken: Token = await Fetcher.fetchTokenData(this.chainId, toAddress); // link                

                let pairs = await this._getPairs(fromToken, toToken, weth);
                const route = new Route(pairs, fromToken, toToken);
                const path: string[] = route.path.map((value, _index, _array) => {
                    return value.address;
                });

                this.logger.debug(`Path: ${path}`);

                const oneToToken = 1 * (10 ** toToken.decimals) + "";

                const trade = new Trade(route, new TokenAmount(toToken, oneToToken), TradeType.EXACT_OUTPUT);
                resolve(trade.executionPrice.toSignificant(6));
            } catch (error) {
                reject(error);
            }
        });
    }

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

    async swap(stro: SwapTokenRequestObject) {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService.loginNoHash(stro.emailAddress, stro.password);
                const sender: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === 'ETH';
                });
                sender.user = user;
                let fromAddress = stro.fromAddress;
                let toAddress = stro.toAddress;

                const weth = WETH[this.chainId];
                if (fromAddress === "0x") {
                    fromAddress = weth.address;
                }

                if (toAddress === "0x") {
                    toAddress = weth.address;
                }
                let result = "";
                if (fromAddress === toAddress) {
                    reject("You can't swap from a token to itself");
                } else {
                    const fromToken: Token = await Fetcher.fetchTokenData(this.chainId, this.web3.utils.toChecksumAddress(fromAddress));
                    const toToken: Token = await Fetcher.fetchTokenData(this.chainId, this.web3.utils.toChecksumAddress(toAddress));
                    if (fromToken.address === weth.address || toToken.address === weth.address) {
                        if (fromToken.address === weth.address) {
                            result = await this.swapEthForToken(sender, toToken, stro.amountIn);
                        } else if (toToken.address === weth.address) {
                            result = await this.swapTokenForEth(sender, fromToken, stro.amountIn);
                        }
                    } else {
                        result = await this.swapTokenForToken(sender, fromToken, toToken, stro.amountIn);
                    }
                }
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    async saveUserToken(toToken: Token, sender: AddressMapping): Promise<UserToken> {
        const uniswapToken: UniswapToken = await this.uniswapTokenRepo.createQueryBuilder("uniswapToken")
            .where("address = :add", { add: toToken.address })
            .getOne();

        const userToken: UserToken = {
            address: uniswapToken.address,
            decimals: uniswapToken.decimals,
            logoURI: uniswapToken.logoURI,
            name: uniswapToken.name,
            symbol: uniswapToken.symbol,
            userId: sender.user.id
        }

        return await this.userTokenRepo.save(userToken);
    }

    async swapTokenForToken(sender: AddressMapping, fromToken: Token, toToken: Token, amountIn: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Check that sender have enough fromAddress tokens        
                sender.fees.decimals = fromToken.decimals;
                sender.fees.contractAddress = fromToken.address;
                const balance: number = await this.ethereumTokensService.getBalance(sender);
                if (balance < amountIn) {
                    const uniswapToken: UniswapToken = await this.uniswapTokenRepo.createQueryBuilder("uniswapToken")
                        .where("address = :add", { add: fromToken.address })
                        .getOne();
                    throw Error(`You don't have enough ${uniswapToken.symbol} to complete this transaction`);
                }

                // 2. Approve Uniswap Router to spend amountIn on fromToken
                const txHash = await this.ethereumTokensService.approve(sender, this.uniswapRouter02Address, amountIn);

                // 3. Swap token using Uniswap Router and Trade
                const weth = WETH[this.chainId];
                let pairs = await this._getPairs(fromToken, toToken, weth);

                const route: Route = new Route(pairs, fromToken, toToken);
                let amountInIsh: string = (amountIn * (10 ** fromToken.decimals)).toLocaleString();
                amountInIsh = amountInIsh.split(',').join('');
                const trade: Trade = new Trade(route, new TokenAmount(fromToken, amountInIsh), TradeType.EXACT_INPUT)
                const slippageTolerance: Percent = new Percent('50', '10000') // 50 bips, or 0.50%
                const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString(); // needs to be converted to e.g. hex

                const nonce: number = await this.web3.eth.getTransactionCount(sender.chainAddress);
                const contract = new this.web3.eth.Contract(this.uniswapRouter02Abi, this.uniswapRouter02Address, { from: sender.chainAddress });

                const block = await this.web3.eth.getBlock("latest");
                const path: string[] = route.path.map((value, _index, _array) => {
                    return value.address;
                });

                const thirtyMinutes = Math.round((new Date().getTime() + (30 * 60 * 1000)) / 1000);                
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.DEFI_GAS_LIMIT),
                    to: this.uniswapRouter02Address,
                    value: "0x0",
                    data: contract.methods.swapExactTokensForTokens(amountInIsh, amountOutMin, path, sender.chainAddress, thirtyMinutes).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }

                const transaction = new Transaction(rawTransaction, { chain: this.chainId });
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                transaction.sign(pk);
                await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))

                // saveUserToken
                await this.saveUserToken(toToken, sender);
                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
    }

    async swapEthForToken(sender: AddressMapping, toToken: Token, amountIn: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {

                // 1. Check that sender have enough fromAddress tokens        
                const balance: number = await this.ethereumService.getBalance(sender.chainAddress);
                if (balance < amountIn) {
                    throw Error(`You don't have enough Ether to complete this transaction`);
                }

                // 3. Swap token using Uniswap Router and Trade
                const weth = WETH[this.chainId];
                let pairs = await this._getPairs(weth, toToken, weth);

                const route: Route = new Route(pairs, weth, toToken);
                let amountInIsh: string = (amountIn * (10 ** weth.decimals)).toLocaleString();
                amountInIsh = amountInIsh.split(',').join('');
                const trade: Trade = new Trade(route, new TokenAmount(weth, amountInIsh), TradeType.EXACT_INPUT)
                const slippageTolerance: Percent = new Percent('50', '10000') // 50 bips, or 0.50%
                const amountOutMin = this.web3.utils.toHex(trade.minimumAmountOut(slippageTolerance).raw.toString()) // needs to be converted to e.g. hex

                const nonce: number = await this.web3.eth.getTransactionCount(sender.chainAddress);
                const contract = new this.web3.eth.Contract(this.uniswapRouter02Abi, this.uniswapRouter02Address, { from: sender.chainAddress });

                const block = await this.web3.eth.getBlock("latest");
                const path: string[] = route.path.map((value, _index, _array) => {
                    return value.address;
                });

                const thirtyMinutes = Math.round((new Date().getTime() + (30 * 60 * 1000)) / 1000);
                
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.DEFI_GAS_LIMIT),
                    to: this.uniswapRouter02Address,
                    value: this.web3.utils.toHex(amountInIsh),
                    data: contract.methods.swapExactETHForTokens(amountOutMin, path, sender.chainAddress, thirtyMinutes).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }

                const transaction = new Transaction(rawTransaction, { chain: this.chainId });
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                transaction.sign(pk);
                await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))

                // saveUserToken
                await this.saveUserToken(toToken, sender);
                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
    }

    async swapTokenForEth(sender: AddressMapping, fromToken: Token, amountIn: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {

                // 1. Check that sender have enough fromAddress tokens        
                sender.fees.decimals = fromToken.decimals;
                sender.fees.contractAddress = fromToken.address;
                this.logger.debug(sender.fees);
                this.logger.debug(fromToken);
                const balance: number = await this.ethereumTokensService.getBalance(sender);
                if (balance < amountIn) {
                    const uniswapToken: UniswapToken = await this.uniswapTokenRepo.createQueryBuilder("uniswapToken")
                        .where("address = :add", { add: fromToken.address })
                        .getOne();
                    //TODO: Uncomment
                    throw Error(`You don't have enough ${uniswapToken.symbol} to complete this transaction`);
                }

                // 2. Approve Uniswap Router to spend amountIn on fromToken
                const txHash = await this.ethereumTokensService.approve(sender, this.uniswapRouter02Address, amountIn);

                // 3. Swap token using Uniswap Router and Trade
                const weth = WETH[this.chainId];
                let pairs = await this._getPairs(fromToken, weth, weth);

                const route: Route = new Route(pairs, fromToken, weth);
                let amountInIsh: string = (amountIn * (10 ** fromToken.decimals)).toLocaleString();
                amountInIsh = amountInIsh.split(',').join('');
                const trade: Trade = new Trade(route, new TokenAmount(fromToken, amountInIsh), TradeType.EXACT_INPUT)
                const slippageTolerance: Percent = new Percent('50', '10000') // 50 bips, or 0.50%
                const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString() // needs to be converted to e.g. hex

                const nonce: number = await this.web3.eth.getTransactionCount(sender.chainAddress);
                const contract = new this.web3.eth.Contract(this.uniswapRouter02Abi, this.uniswapRouter02Address, { from: sender.chainAddress });

                const block = await this.web3.eth.getBlock("latest");
                const path: string[] = route.path.map((value, _index, _array) => {
                    return value.address;
                });

                const thirtyMinutes = Math.round((new Date().getTime() + (30 * 60 * 1000)) / 1000);
                
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.DEFI_GAS_LIMIT),
                    to: this.uniswapRouter02Address,
                    value: "0x0",
                    data: contract.methods.swapExactTokensForETH(amountInIsh, amountOutMin, path, sender.chainAddress, thirtyMinutes).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }

                const transaction = new Transaction(rawTransaction, { chain: this.chainId });
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                transaction.sign(pk);
                this.logger.debug(transaction.serialize().toString('hex'));
                await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))

                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
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
                    if (this.chainId === ChainId.ROPSTEN) {
                        const dbTokens: UniswapToken[] = [
                            {
                                address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                                chainId: this.chainId,
                                decimals: 18,
                                logoURI: "",
                                name: "Uniswap",
                                symbol: "UNI"
                            },
                            {
                                address: "0xf80a32a835f79d7787e8a8ee5721d0feafd78108",
                                chainId: this.chainId,
                                decimals: 18,
                                logoURI: "",
                                name: "DAI",
                                symbol: "DAI"
                            }
                        ]
                        resolve(dbTokens);
                    } else {
                        const dbTokens = await this.uniswapTokenRepo.find();
                        resolve(dbTokens);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async _getPairs(fromToken: Token, toToken: Token, weth: Token): Promise<Pair[]> {
        let pairs: Pair[] = [];
        if (fromToken.address !== weth.address && toToken.address !== weth.address) {
            const pair1 = await Fetcher.fetchPairData(fromToken, weth);
            const pair2 = await Fetcher.fetchPairData(weth, toToken);
            pairs.push(pair1);
            pairs.push(pair2);
        } else {
            const pair1 = await Fetcher.fetchPairData(fromToken, toToken);
            pairs.push(pair1);
        }

        return pairs;
    }
}