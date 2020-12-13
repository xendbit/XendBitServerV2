import { Injectable, Logger } from '@nestjs/common';
import { mnemonicToSeedSync } from 'bip39';
import { AES } from 'crypto-js';
import { hdkey } from 'ethereumjs-wallet';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { WALLET_TYPE } from 'src/utils/enums';
import Web3 from 'web3';
import { Config } from './config.service';
import { XendChainService } from './xendchain.service';

@Injectable()
export class EthereumService {
    private readonly logger = new Logger(EthereumService.name);
    web3: Web3;

    constructor(private config: Config, private xendChain: XendChainService) {
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
            chain: WALLET_TYPE.ETH,
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