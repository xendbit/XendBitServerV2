import { Injectable, Logger } from '@nestjs/common';
import { AddressMapping } from 'src/models/address.mapping.entity';
import Web3 from 'web3';
import { Config } from './config.service';
import { Transaction, TxData } from 'ethereumjs-tx';
import { AES, enc } from 'crypto-js';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { History } from './blockchain.service';
import { erc20Abi } from '../abis/erc20.abi';
import { NonceManager } from './nonce-manager.service';

@Injectable()
export class EthereumTokensService {

    private readonly logger = new Logger(EthereumTokensService.name);
    private web3: Web3;
    private erc20Abi;
    private httpService: HttpClient;

    constructor(private config: Config) {
        this.web3 = new Web3(this.config.p["ethereum.server.url"]);
        this.erc20Abi = erc20Abi;
        this.httpService = new HttpClient('Blockchain.info API');
    }

    getTokens(ethAM: AddressMapping): AddressMapping[] {
        const mappings: AddressMapping[] = [];
        mappings.push(this.getUSDT(ethAM));
        mappings.push(this.getLINK(ethAM));
        mappings.push(this.getBNB(ethAM));
        return mappings;
    }

    async history(address: string, contractAddress: string): Promise<History[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const url = this.config.p["erc20.history.api.url"]
                    + "&contractaddress=" + contractAddress
                    + "&address=" + address
                    + "&sort=desc";
                this.logger.debug(url);
                const res = await this.httpService.get(url);
                const transactions: History[] = [];
                if (res.message.statusCode === 200) {
                    const body = await res.readBody();
                    const parsed = JSON.parse(body);
                    const txs = parsed.result;
                    for (let tx of txs) {
                        const tokenDecimal = tx.tokenDecimal;
                        const value = tx.value / (10 ** tokenDecimal);
                        const history: History = {
                            date: new Date(tx.timeStamp * 1000).toISOString().substr(0, 10),
                            hash: tx.hash,
                            value: value,
                            status: "IN/OUT"
                        }

                        transactions.push(history);
                    }
                }

                resolve(transactions);
            } catch (error) {
                reject(error);
            }
        });
    }

    getBNB(ethAM: AddressMapping): AddressMapping {
        const am: AddressMapping = { ...ethAM };
        am.chain = 'BNB';
        am.fees = {
            minXendFees: this.config.p["BNB"]["min.xend.fees"],
            minBlockFees: this.config.p["BNB"]["min.block.fees"],
            externalDepositFees: this.config.p["BNB"]["external.deposit.fees"],
            percExternalTradingFees: this.config.p["BNB"]["perc.external.trading.fees"],
            externalWithdrawalFees: this.config.p["BNB"]["external.withdrawal.fees"],
            maxXendFees: this.config.p["BNB"]["max.xend.fees"],
            percXendFees: this.config.p["BNB"]["perc.xend.fees"],
            decimals: this.config.p.BNB.decimals,
            minBuyAmount: this.config.p.BNB['min.buy.amount'],
            contractAddress: this.config.p.BNB['contract.address'],
            logoURI: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
        }

        return am;
    }

    getUSDT(ethAM: AddressMapping): AddressMapping {
        const am: AddressMapping = { ...ethAM };
        am.chain = 'USDT';
        am.fees = {
            minXendFees: this.config.p["USDT"]["min.xend.fees"],
            minBlockFees: this.config.p["USDT"]["min.block.fees"],
            externalDepositFees: this.config.p["USDT"]["external.deposit.fees"],
            percExternalTradingFees: this.config.p["USDT"]["perc.external.trading.fees"],
            externalWithdrawalFees: this.config.p["USDT"]["external.withdrawal.fees"],
            maxXendFees: this.config.p["USDT"]["max.xend.fees"],
            percXendFees: this.config.p["USDT"]["perc.xend.fees"],
            decimals: this.config.p.USDT.decimals,
            minBuyAmount: this.config.p.USDT['min.buy.amount'],
            contractAddress: this.config.p.USDT['contract.address'],
        }

        return am;
    }

    getGenericToken(ethAM: AddressMapping, chain: string, decimals: number, contractAddress: string): AddressMapping {
        const am: AddressMapping = { ...ethAM };
        am.chain = chain;
        am.chainAddress = ethAM.chainAddress;
        am.fees = {
            minXendFees: this.config.p["USDT"]["min.xend.fees"],
            minBlockFees: this.config.p["USDT"]["min.block.fees"],
            externalDepositFees: -1,
            percExternalTradingFees: -1,
            externalWithdrawalFees: -1,
            maxXendFees: this.config.p["USDT"]["max.xend.fees"],
            percXendFees: this.config.p["USDT"]["perc.xend.fees"],
            decimals: decimals,
            minBuyAmount: this.config.p.USDT['min.buy.amount'],
            contractAddress: contractAddress,
        }

        return am;
    }

    getLINK(ethAM: AddressMapping): AddressMapping {
        const am: AddressMapping = { ...ethAM };
        am.chain = 'LINK';
        am.fees = {
            minXendFees: this.config.p["LINK"]["min.xend.fees"],
            minBlockFees: this.config.p["LINK"]["min.block.fees"],
            externalDepositFees: this.config.p["LINK"]["external.deposit.fees"],
            percExternalTradingFees: this.config.p["LINK"]["perc.external.trading.fees"],
            externalWithdrawalFees: this.config.p["LINK"]["external.withdrawal.fees"],
            maxXendFees: this.config.p["LINK"]["max.xend.fees"],
            percXendFees: this.config.p["LINK"]["perc.xend.fees"],
            decimals: this.config.p.LINK.decimals,
            minBuyAmount: this.config.p.LINK['min.buy.amount'],
            contractAddress: this.config.p.LINK['contract.address'],
        }

        return am;
    }

    getBalance(sender: AddressMapping): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const decimals: number = +sender.fees.decimals;
                const contract = new this.web3.eth.Contract(this.erc20Abi, sender.fees.contractAddress, { from: sender.chainAddress });
                const balance = await contract.methods.balanceOf(sender.chainAddress).call({ from: sender.chainAddress });
                resolve(balance / (10 ** decimals));
            } catch (error) {
                reject(error);
            }
        });
    }

    checkBalance(sender: AddressMapping, amount: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const balance = await this.getBalance(sender);
                if (amount > balance) {
                    throw Error(`Insufficient ${sender.chain} balance.`);
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    approve(sender: AddressMapping, recipient: string, amount: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const decimals: number = +sender.fees.decimals;
                let amountIsh = (amount * (10 ** decimals)).toLocaleString();
                amountIsh = amountIsh.split(',').join('');
                const amountHex = this.web3.utils.toHex(amountIsh);
                const nonce: number = await NonceManager.getNonce(this.web3, sender.chainAddress);
                const contract = new this.web3.eth.Contract(this.erc20Abi, sender.fees.contractAddress, { from: sender.chainAddress });

                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.TOKENS_GAS_LIMIT),
                    to: sender.fees.contractAddress,
                    value: "0x0",
                    data: contract.methods.approve(recipient, amountHex).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }

                const transaction = new Transaction(rawTransaction);
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                transaction.sign(pk);
                this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
    }

    sendToken(sender: AddressMapping, recipient: string, amount: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const decimals: number = +sender.fees.decimals;
                let amountIsh = (amount * (10 ** decimals)).toLocaleString();
                amountIsh = amountIsh.split(',').join('');
                const amountHex = this.web3.utils.toHex(amountIsh);
                const nonce: number = await NonceManager.getNonce(this.web3, sender.chainAddress);
                const contract = new this.web3.eth.Contract(this.erc20Abi, sender.fees.contractAddress, { from: sender.chainAddress });

                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.TOKENS_GAS_LIMIT),
                    to: sender.fees.contractAddress,
                    value: "0x0",
                    data: contract.methods.transfer(recipient, amountHex).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }

                this.logger.debug(rawTransaction);

                const transaction = new Transaction(rawTransaction);
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                transaction.sign(pk);
                this.logger.debug(transaction.serialize().toString('hex'));
                this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
    }
}
