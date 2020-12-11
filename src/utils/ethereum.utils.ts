import { Injectable, Logger } from '@nestjs/common';
import { mnemonicToSeedSync } from 'bip39';
import { AES } from 'crypto-js';
import { hdkey } from 'ethereumjs-wallet';
import { AddressMapping } from 'src/models/address.mapping.entity';
import Web3 from 'web3';
import { Config } from './config';
import { XendChainUtils } from './xendchain.utils';

@Injectable()
export class EthereumUtils {
    private readonly logger = new Logger(EthereumUtils.name);
    web3: Web3;

    constructor(private config: Config, private xendChain: XendChainUtils) {
        this.web3 = new Web3(this.config.p["ethereum.server.url"]);
    }

    async getBalance(address: string): Promise<number> {
        return this.web3.eth.getBalance(address);
    }

    getEthereumAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const root = hdkey.fromMasterSeed(seed);
        var path = "m/44'/60'/0'/0/0";
        const addrNode = root.derivePath(path)

        addrNode.privateExtendedKey

        const pk = addrNode.getWallet().getPrivateKeyString();
        this.xendChain.importPrivateKey(pk);

        const encWif = AES.encrypt(addrNode.getWallet().getPrivateKeyString(), process.env.KEY).toString();
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