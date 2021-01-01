import { AddressMapping } from "src/models/address.mapping.entity";
import { bip32, payments, networks, Psbt, ECPair } from 'bitcoinjs-lib';
import { mnemonicToSeedSync } from 'bip39';
import { Config } from './config.service';
import { AES, enc } from "crypto-js";
import { Injectable, Logger } from "@nestjs/common";
import { ImportAddressParams, ListUnspentParams, RPCClient } from 'rpc-bitcoin';
import { BitcoinTransaction } from "src/models/bitcoin.transaction";
import { WALLET_TYPE } from "src/utils/enums";
import { HttpClient } from "typed-rest-client/HttpClient";
import { History } from "./blockchain.service";

@Injectable()
export class BitcoinService {

    private readonly logger = new Logger(BitcoinService.name);
    client: RPCClient;
    static SATOSHI = 100000000;
    psbt: Psbt;

    httpService: HttpClient;

    constructor(private config: Config) {
        const url = this.config.p["bitcoin.server.url"];
        const user = process.env.BITCOIN_RPC_USER;
        const pass = process.env.BITCOIN_RPC_PASS;
        const port = this.config.p["bitcoin.port"];
        const timeout = this.config.p["bitcoin.timeout"];
        this.client = new RPCClient({ url, port, timeout, user, pass });
        this.httpService = new HttpClient('Blockchain.info API');
    }

    async send(sender: AddressMapping, recipient: string, amount: number, xendFees: number, blockFees: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                this.psbt = new Psbt({ network: networks.bitcoin });
                this.psbt.setVersion(2);
                this.psbt.setLocktime(0);

                const xendAddress: string = this.config.p.BTC["xend.fees.address"];
                const requiredAmount: number = amount + xendFees + blockFees;

                const unspents: BitcoinTransaction[] = await this.listUnspent([sender.chainAddress]);

                if (unspents.length == 0) {
                    throw Error('Insufficient funds');
                }

                for (let unspent of unspents) {
                    // get the full hex
                    const fullTx = await this.client.gettransaction({ txid: unspent.txid });
                    const hex = fullTx.hex;
                    this.psbt.addInput({
                        hash: unspent.txid,  // txid number
                        index: unspent.vout,  // output number
                        sequence: 0xfffffffe,
                        nonWitnessUtxo: Buffer.from(hex, 'hex'), // works for witness inputs too!
                    });
                }

                const totalUTXO = unspents.map((x: BitcoinTransaction) => {
                    return x.amount;
                }).reduce((sum: number, x: number) => {
                    return sum += x;
                });

                let change = 0;
                if (totalUTXO < requiredAmount) {
                    throw Error('Insufficient funds');
                } else {
                    change = totalUTXO - requiredAmount;
                }

                const changeAddress = sender.chainAddress;

                this.psbt.addOutput({
                    address: recipient,
                    value: Math.round(amount * BitcoinService.SATOSHI),
                });

                this.psbt.addOutput({
                    address: xendAddress,
                    value: Math.round(xendFees * BitcoinService.SATOSHI)
                });

                if (change > 0) {
                    this.psbt.addOutput({
                        address: changeAddress,
                        value: Math.round(change * BitcoinService.SATOSHI)
                    });
                }

                unspents.forEach((_unspent, index) => {
                    this.psbt.signInput(index, ECPair.fromWIF(AES.decrypt(sender.wif, process.env.KEY).toString(enc.Utf8)));
                });

                const signaturesValid = this.psbt.validateSignaturesOfAllInputs();
                this.logger.debug('is signatures valid: ' + signaturesValid);
                this.psbt.finalizeAllInputs();

                const txHex = this.psbt.extractTransaction().toHex();

                const response = await this.client.sendrawtransaction({ hexstring: txHex });
                resolve(response);
            } catch (e) {
                reject(e);
            }
        });
    }

    async listUnspent(addresses: string[]): Promise<BitcoinTransaction[]> {
        const params: ListUnspentParams = {
            addresses: addresses,
            maxconf: 999999,
            minconf: 1
        };

        const unspents: BitcoinTransaction[] = await this.client.listunspent(params);
        return unspents;
    }

    getNetwork() {
        if (this.config.p["bitcoin.testnet"]) {
            return networks.testnet;
        }

        return networks.bitcoin;
    }

    private getAddress(node: any, network?: any): string {
        return payments.p2pkh({ pubkey: node.publicKey, network }).address!;
    }

    async getBalance(addresses: string[]): Promise<number> {
        const unspents: BitcoinTransaction[] = await this.listUnspent(addresses);
        if (unspents.length == 0) {
            return 0;
        }
        const sum = 0;
        const balance: number = unspents.map((x: BitcoinTransaction) => {
            return x.amount;
        }).reduce((sum: number, x: number) => {
            return sum += x;
        })

        return balance;
    }

    decryptWif(encWif: string): string {
        return AES.decrypt(encWif, process.env.KEY).toString(enc.Utf8);
    }

    getBitcoinAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const node = bip32.fromSeed(seed);
        // const strng = node.toBase58();
        // const restored = bip32.fromBase58(strng);
        const address = this.getAddress(node, this.getNetwork());
        const wif = node.toWIF();

        const params: ImportAddressParams = {
            address: address,
            label: address,
            rescan: false
        };

        this.client.importaddress(params).then((x) => {
            this.logger.debug('Imported BTC Addreess');
        });

        const encWif = AES.encrypt(wif, process.env.KEY).toString();
        const am: AddressMapping = {
            chain: WALLET_TYPE.BTC,
            chainAddress: address,
            mnemonicCode: passphrase,
            wif: encWif,
            minXendFees: this.config.p["BTC"]["min.xend.fees"],
            minBlockFees: this.config.p["BTC"]["min.block.fees"],
            externalDepositFees: this.config.p["BTC"]["external.deposit.fees"],
            percExternalTradingFees: this.config.p["BTC"]["perc.external.trading.fees"],
            externalWithdrawalFees: this.config.p["BTC"]["external.withdrawal.fees"],
            maxXendFees: this.config.p["BTC"]["max.xend.fees"],
            percXendFees: this.config.p["BTC"]["perc.xend.fees"]
        }

        return am;
    }

    async history(address: string): Promise<History[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const url = this.config.p["btc.history.api.url"] + address;
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
                            value: tx.value/BitcoinService.SATOSHI,
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