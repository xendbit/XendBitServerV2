import { AddressMapping } from "src/models/address.mapping.entity";
import { bip32, payments, networks } from 'bitcoinjs-lib';
import { mnemonicToSeedSync } from 'bip39';
import { Config } from './config';
import { AES } from "crypto-js";
import { Injectable } from "@nestjs/common";
import { ImportPrivKeyParams, ListUnspentParams, RPCClient } from 'rpc-bitcoin';
import { BitcoinTransaction } from "src/models/bitcoin.transaction";

@Injectable()
export class BitcoinUtils {

    client: RPCClient;

    constructor(private config: Config) {
        const url = this.config.p["bitcoin.server.url"];
        const user = process.env.BITCOIN_RPC_USER;
        const pass = process.env.BITCOIN_RPC_PASS;
        const port = this.config.p["bitcoin.port"];
        const timeout = this.config.p["bitcoin.timeout"];
        this.client = new RPCClient({ url, port, timeout, user, pass });
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
        const params: ListUnspentParams = {
            addresses: addresses,
            maxconf: 999999,
            minconf: 2
        };

        const unspents: BitcoinTransaction[] = await this.client.listunspent(params);
        if(unspents.length == 0) {
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

    getBitcoinAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const node = bip32.fromSeed(seed);
        // const strng = node.toBase58();
        // const restored = bip32.fromBase58(strng);
        const address = this.getAddress(node, this.getNetwork());
        const wif = node.toWIF();

        const params: ImportPrivKeyParams = {
            privkey: wif,
            label: address,
            rescan: false
        };

        this.client.importprivkey(params).then((x) => {
            console.log("Imported BTC");
        });

        const encWif = AES.encrypt(wif, process.env.KEY).toString();
        const am: AddressMapping = {
            chain: 'BTC',
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