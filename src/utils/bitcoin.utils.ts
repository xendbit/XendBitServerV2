import { AddressMapping } from "src/models/address.mapping.entity";
import { bip32, payments, networks } from 'bitcoinjs-lib';
import { mnemonicToSeedSync } from 'bip39';
import { Config } from './config';
import { AES } from "crypto-js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class BitcoinUtils {

    constructor(private config: Config) {}

    getNetwork() {
        if (this.config.p["bitcoin.testnet"]) {
            return networks.testnet;
        }

        return networks.bitcoin;
    }

    private getAddress(node: any, network?: any): string {
        return payments.p2pkh({ pubkey: node.publicKey, network }).address!;
    }

    getBitcoinAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const node = bip32.fromSeed(seed);
        // const strng = node.toBase58();
        // const restored = bip32.fromBase58(strng);
        const address = this.getAddress(node, this.getNetwork());
        const wif = node.toWIF();

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