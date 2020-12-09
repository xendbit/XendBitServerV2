import { Injectable, Logger } from '@nestjs/common';
import { mnemonicToSeedSync } from 'bip39';
import { AES } from 'crypto-js';
import { hdkey } from 'ethereumjs-wallet';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { Config } from './config';

@Injectable()
export class EthereumUtils {
    private readonly logger = new Logger(EthereumUtils.name);
    
    constructor(private config: Config) {
    }
    
    getEthereumAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const root = hdkey.fromMasterSeed(seed);
        var path = "m/44'/60'/0'/0/0";
        const addrNode = root.derivePath(path)
        
        addrNode.privateExtendedKey

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
}