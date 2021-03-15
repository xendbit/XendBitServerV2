import { Injectable, Logger } from '@nestjs/common';
import { mnemonicToSeedSync } from 'bip39';
import { AES, enc } from 'crypto-js';
import { hdkey } from 'ethereumjs-wallet';
import { AddressMapping } from 'src/models/address.mapping.entity';
import Web3 from 'web3';
import { Config } from './config.service';
import { Transaction, TxData } from 'ethereumjs-tx';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { History } from './blockchain.service';
import { NonceManager } from './nonce-manager.service';

@Injectable()
export class EthereumService {
    private readonly logger = new Logger(EthereumService.name);
    web3: Web3;
    httpService: HttpClient;
    static WEI = 10**18;

    constructor(private config: Config) {
        this.web3 = new Web3(this.config.p["ethereum.server.url"]);
        this.httpService = new HttpClient('Blockchain.info API');
        // this.logger.debug(AES.decrypt('U2FsdGVkX18Y43DB1E5MzYcD6Ga+Pfzr0WM0AN+YqcGdqYd/vsyvw7865v7tZ70xH85x1C4AYFP6LxmI3Pkp3+2TDxZhBv9+EHn3975I9e+ietvUk7PiA/SJeLuQ5EC8', process.env.KEY).toString(enc.Utf8));
        // this.logger.debug(AES.encrypt('Baba fi owo kan idodo omo oni dodo ni dodo ilu wa fi', process.env.KEY).toString());
        // this.logger.debug(Buffer.from(SHA256('Baba fi owo kan idodo omo oni dodo ni dodo ilu wa fi').toString()).toString('base64'));
    }

    async getBalance(address: string): Promise<number> {
        return +this.web3.utils.fromWei(await this.web3.eth.getBalance(address), 'ether').toString();
    }

    async history(address: string): Promise<History[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const url = this.config.p["eth.history.api.url"] + address;
                this.logger.debug(url);
                const res = await this.httpService.get(url);
                const transactions: History[] = [];
                if (res.message.statusCode === 200) {
                    const body = await res.readBody();
                    const parsed = JSON.parse(body);
                    const txs = parsed.txrefs;                    
                    for(let tx of txs) {
                        const history: History = {
                            date: tx.confirmed.substr(0, 10),
                            hash: tx.tx_hash,
                            value: tx.value/EthereumService.WEI,
                            status: tx.tx_input_n === -1 ? "IN" : "OUT"
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

    async send(sender: AddressMapping, recipient: string, amount: number, xendFees: number, blockFees: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const nonce: number = await NonceManager.getNonce(this.web3, sender.chainAddress);

                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(process.env.GAS_PRICE),
                    gasLimit: this.web3.utils.toHex(process.env.GAS_LIMIT),
                    to: recipient,
                    value: this.web3.utils.toHex(this.web3.utils.toWei(amount, "ether")),
                    nonce: this.web3.utils.toHex(nonce)
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
    
    getEthereumAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const root = hdkey.fromMasterSeed(seed);
        var path = "m/44'/60'/0'/0/0";
        const addrNode = root.derivePath(path)

        const pk = addrNode.getWallet().getPrivateKeyString();

        const encWif = AES.encrypt(pk, process.env.KEY).toString();
        const am: AddressMapping = {
            chain: 'ETH',
            chainAddress: addrNode.getWallet().getAddressString(),
            mnemonicCode: passphrase,
            wif: encWif,
            minXendFees: this.config.p["ETH"]["min.xend.fees"],
            minBlockFees: this.config.p["ETH"]["min.block.fees"],
            externalDepositFees: this.config.p["ETH"]["external.deposit.fees"],
            percExternalTradingFees: this.config.p["ETH"]["perc.external.trading.fees"],
            externalWithdrawalFees: this.config.p["ETH"]["external.withdrawal.fees"],
            maxXendFees: this.config.p["ETH"]["max.xend.fees"],
            percXendFees: this.config.p["ETH"]["perc.xend.fees"]
        }

        return am;
    }

    getFees(am: AddressMapping) {
        return {
            minXendFees: am.minXendFees,
            minBlockFees: am.minBlockFees,
            externalDepositFees: am.externalDepositFees,
            percExternalTradingFees: am.percExternalTradingFees,
            externalWithdrawalFees: am.externalWithdrawalFees,
            maxXendFees: am.maxXendFees,
            percXendFees: am.percXendFees
        }
    }
}

export class Address {
    address: string;
    privateKey: Buffer;
}