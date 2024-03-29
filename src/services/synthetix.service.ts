import { Injectable, Logger } from '@nestjs/common';
import { ChainId } from '@uniswap/sdk';
import Web3 from 'web3';
import { Config } from './config.service';
import { synthetixAbi } from '../abis/synthetix.abis';
import { Transaction, TxData } from 'ethereumjs-tx';
import { AES, enc } from 'crypto-js';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { NonceManager } from './nonce-manager.service';

@Injectable()
export class SynthetixService {
    private readonly logger = new Logger(SynthetixService.name);
    private web3: Web3;
    private chainId: number;
    private synthetixContract;
    private contractor;

    constructor(
        private config: Config,
    ) {
        this.chainId = ChainId.MAINNET;
        this.contractor = this.config.p['xend.address'];
        this.synthetixContract = this.config.p['synthetix.contract'];
        this.web3 = new Web3(this.config.p["ethereum.server.url"]);
        // this._test();
    }

    async debtBalance(am: AddressMapping): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const contract = new this.web3.eth.Contract(synthetixAbi, this.synthetixContract);
                const debtBalance = await contract.methods.debtBalanceOf(am.chainAddress, 'sUSD');
                resolve(debtBalance);
            } catch (error) {
                reject(error);
            }
        });
    }

    async unstake(sender: AddressMapping): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const nonce: number = await NonceManager.getNonce(this.web3, sender.chainAddress);

                const contract = new this.web3.eth.Contract(synthetixAbi, this.synthetixContract);

                contract.methods.debtBalanceOf(sender.chainAddress, this.web3.utils.fromAscii('sUSD')).call({ from: sender.chainAddress }).then(x => {
                    
                });
                
                // const debtBalance = await contract.methods.debtBalanceOf(sender.chainAddress, 'sUSD').call({ from: sender.chainAddress });
                // console.log(`debtBalance`);
                resolve('Hello');
                // // var rawTransaction: TxData = {
                // //     gasPrice: this.web3.utils.toHex(process.env.SYNTH_GAS_PRICE),
                // //     gasLimit: this.web3.utils.toHex(process.env.SYNTH_GAS_LIMIT),
                // //     to: this.synthetixContract,
                // //     value: "0x0",
                // //     data: contract.methods.burnSynths(debtBalance).encodeABI(),
                // //     nonce: this.web3.utils.toHex(nonce),
                // // }
    
                // // const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                // // const transaction = new Transaction(rawTransaction);
                // // transaction.sign(pk);
                // // const trx = await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));

                // resolve(trx.transactionHash);

            } catch (error) {
                reject(error);
            }
        });
    }

    async stake(amount: number, sender: AddressMapping): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const amountHex = this.web3.utils.toHex(amount);
                const nonce: number = await NonceManager.getNonce(this.web3, sender.chainAddress);
    
                const contract = new this.web3.eth.Contract(synthetixAbi, this.synthetixContract);
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.SYNTH_GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.SYNTH_GAS_LIMIT),
                    to: this.synthetixContract,
                    value: "0x0",
                    data: contract.methods.issueSynths(amountHex).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }
    
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                const transaction = new Transaction(rawTransaction);
                transaction.sign(pk);
                const trx = await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));

                resolve(trx.transactionHash);
            } catch (error) {
                reject(error);
            }
        });
    }

    async _test() {
        this.logger.debug("Testing...");
        this.logger.debug(this.web3.utils.toWei("100", 'ether'));
        const contract = new this.web3.eth.Contract(synthetixAbi, this.synthetixContract);
        contract.methods.totalSupply().call().then(async (ts) => {
            this.logger.debug(ts);
            this.logger.debug(this.web3.utils.fromWei(ts, 'ether'));

            const amountHex = this.web3.utils.toHex(1);
            const nonce: number = await NonceManager.getNonce(this.web3, this.contractor);

            const xendPK = Buffer.from(AES.decrypt(process.env.XEND_CREDIT_WIF, process.env.KEY).toString(enc.Utf8), 'hex');

            var rawTransaction: TxData = {
                gasPrice: this.web3.utils.toHex(process.env.SYNTH_GAS_PRICE),
                gasLimit: this.web3.utils.toHex(process.env.SYNTH_GAS_LIMIT),
                to: this.synthetixContract,
                value: "0x0",
                data: contract.methods.issueSynths(amountHex).encodeABI(),
                nonce: this.web3.utils.toHex(nonce),
            }

            const transaction = new Transaction(rawTransaction);
            transaction.sign(xendPK);
            const trx = await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
            this.logger.debug(trx);
        }, (error) => {
            this.logger.debug(error);
        })
    }
}
