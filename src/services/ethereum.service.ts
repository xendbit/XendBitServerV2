import { Injectable, Logger } from '@nestjs/common';
import { mnemonicToSeedSync } from 'bip39';
import { AES, enc } from 'crypto-js';
import { hdkey } from 'ethereumjs-wallet';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { WALLET_TYPE } from 'src/utils/enums';
import Web3 from 'web3';
import { Config } from './config.service';
import { XendChainService } from './xendchain.service';
import { Transaction, TxData } from 'ethereumjs-tx';
import EthereumHDKey from 'ethereumjs-wallet/dist/hdkey';

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

    async send(sender: AddressMapping, recipient: string, amount: number, xendFees: number, blockFees: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const nonce: number = await this.web3.eth.getTransactionCount(sender.chainAddress);

                const block = await this.web3.eth.getBlock("latest");
                var rawTransaction: TxData = {
                    gasPrice: this.web3.utils.toHex(block.gasUsed),
                    gasLimit: this.web3.utils.toHex(block.gasLimit),
                    to: recipient,
                    value: this.web3.utils.toWei(amount, "ether"),
                    nonce: this.web3.utils.toHex(nonce)
                }


                const transaction = new Transaction(rawTransaction);
                transaction.sign(this.getAddressFromEncryptedPK(sender.wif).privateKey);
                const reciept = await this.web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
                resolve(reciept.transactionHash);

                resolve(reciept.transactionHash);
            } catch (error) {
                reject(error);
            }
        });
    }

    getAddressFromEncryptedPK(encrypted: string): Address {
        const passphrase = AES.decrypt(encrypted, process.env.KEY).toString(enc.Utf8);
        return this.getAddress(passphrase);
    }

    getAddress(passphrase: string): Address {
        const seed: Buffer = mnemonicToSeedSync(passphrase);
        const root: EthereumHDKey = hdkey.fromMasterSeed(seed);
        var path = "m/44'/60'/0'/0/0";
        const addrNode: EthereumHDKey = root.derivePath(path);
        const pk: Buffer = addrNode.getWallet().getPrivateKey();
        return {
            address: addrNode.getWallet().getAddressString(),
            privateKey: pk
        }
    }

    getEthereumAddress(passphrase: string): AddressMapping {
        const seed = mnemonicToSeedSync(passphrase);
        const root = hdkey.fromMasterSeed(seed);
        var path = "m/44'/60'/0'/0/0";
        const addrNode = root.derivePath(path)

        const pk = addrNode.getWallet().getPrivateKeyString();

        const encWif = AES.encrypt(passphrase, process.env.KEY).toString();
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

export class Address {
    address: string;
    privateKey: Buffer;
}