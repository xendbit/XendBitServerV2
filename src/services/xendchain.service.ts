import { Injectable, Logger } from "@nestjs/common";
import { AES, enc } from "crypto-js";
import Web3 from 'web3';
import Common from 'ethereumjs-common';
import { Config } from "./config.service";
import { Transaction, TxData } from 'ethereumjs-tx';
import { AddressMapping } from "src/models/address.mapping.entity";

@Injectable()
export class XendChainService {
    private readonly logger = new Logger(XendChainService.name);
    ngncContract;
    ngncContractAddress;
    web3;
    erc20Abi;
    chain: Common;

    constructor(private config: Config) {      
        this.init();  
    }

    init() {
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.p["xendchain.server.url"]));
        this.erc20Abi = this.config.ngncAbi;
        this.ngncContractAddress = this.config.p["ngnc.contract.address"];
        this.ngncContract = new this.web3.eth.Contract(this.erc20Abi, this.ngncContractAddress);
        this.chain = Common.forCustomChain(
            'mainnet',
            {
                name: 'xDAI-chain',
                networkId: 100,
                chainId: 100,
            },
            'istanbul',
        );
    }

    getNgncBalance(address: string): Promise<number> {
        this.logger.debug(`Getting balance for ${address}`);        
        return new Promise(async (resolve, reject) => {
            try {
                const balance = await this.ngncContract.methods.balanceOf(address).call({ from: address });
                // value is in kobo....divide by 100 to get naira
                resolve(Math.round(balance / 100));
            } catch (error) {
                reject(error);
            }
        });
    }

    checkNgncBalance(address: string, compareBalance: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const balance = await this.getNgncBalance(address);
                if (compareBalance > balance) {
                    throw Error(`Insufficient xNGN balance.`);
                }
        
                resolve(true);        
            } catch (error) {
                reject(error);
            }
        });
    }

    fundNgnc(address: string, amount: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                amount = Math.round(amount * (10**2));
                const xendPK = Buffer.from(AES.decrypt(process.env.XEND_CREDIT_WIF, process.env.KEY).toString(enc.Utf8), 'hex');
                const xendAddress = this.config.p["xend.address"];
                const amountHex = this.web3.utils.toHex(amount);
                const nonce: number = await this.web3.eth.getTransactionCount(xendAddress);
                const contract = new this.web3.eth.Contract(this.erc20Abi, this.ngncContractAddress, { from: xendAddress });

                const block = await this.web3.eth.getBlock("latest");
                this.logger.debug(block);
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(1000000000),
                    gasLimit: this.web3.utils.toHex(block.gasLimit),
                    to: this.ngncContractAddress,
                    value: "0x0",
                    data: contract.methods.transfer(address, amountHex).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),                                    
                }

                this.logger.debug(rawTransaction);
                const transaction = new Transaction(rawTransaction, {common: this.chain});
                transaction.sign(xendPK);
                await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));        
                this.logger.debug(`Account funding succcessul`);
                // Give the user some xDAI if they don't already have it.
                this.giveGas(address);
                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
    }

    async giveGas(address: string) {
        this.logger.debug("checking if user require gas");
        const availableGas = +this.web3.utils.fromWei(await this.web3.eth.getBalance(address), 'ether').toString();
        this.logger.debug(`availableGas: ${availableGas}`);
        if(availableGas < 0.01) {
            // gas depleted, give some gas
            this.logger.debug(`Gas Depleted, Giving ${address} some gas`);
            const xendPK = Buffer.from(AES.decrypt(process.env.XEND_CREDIT_WIF, process.env.KEY).toString(enc.Utf8), 'hex');
            const xendAddress = this.config.p["xend.address"];

            const nonce: number = await this.web3.eth.getTransactionCount(xendAddress);

            var rawTransaction: TxData = {
                gasPrice: this.web3.utils.toHex(1000000000),
                gasLimit: this.web3.utils.toHex(process.env.GAS_LIMIT),
                to: address,
                value: this.web3.utils.toWei(0.01, "ether"),
                nonce: this.web3.utils.toHex(nonce)
            }
            
            const transaction = new Transaction(rawTransaction);            
            transaction.sign(xendPK);
            this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));   
        } 
    }

    sendNgnc(sender: AddressMapping, recipient: string, amount: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                amount = Math.round(amount * (10**2));
                const amountHex = this.web3.utils.toHex(amount);
                const nonce: number = await this.web3.eth.getTransactionCount(sender.chainAddress);
                const contract = new this.web3.eth.Contract(this.erc20Abi, this.ngncContractAddress, { from: sender.chainAddress });

                const block = await this.web3.eth.getBlock("latest");
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(1000000000),
                    gasLimit: this.web3.utils.toHex(block.gasLimit),
                    to: this.ngncContractAddress,
                    value: "0x0",
                    data: contract.methods.transfer(recipient, amountHex).encodeABI(),
                    nonce: this.web3.utils.toHex(nonce),
                }

                const transaction = new Transaction(rawTransaction, {common: this.chain});
                const pk = Buffer.from(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8).replace('0x', ''), 'hex');
                transaction.sign(pk);
                await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
                resolve("Success");
            } catch (error) {
                reject(error);
            }
        });
    }
}
