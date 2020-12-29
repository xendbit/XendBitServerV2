import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { SendCoinsRequestObject } from 'src/models/request.objects/send.coins.ro';
import { TradeRequestObject } from 'src/models/request.objects/trade.ro';
import { User } from 'src/models/user.entity';
import { WALLET_TYPE } from 'src/utils/enums';
import { Repository } from 'typeorm';
import { BinanceService } from './binance.service';
import { BitcoinService } from './bitcoin.service';
import { BlockchainService } from './blockchain.service';
import { UserService } from './user.service';

@Injectable()
export class ExchangeService {
    @InjectRepository(AddressMapping) 
    private amRepo: Repository<AddressMapping>
    constructor(
        private binanceService: BinanceService,
        private userService: UserService,
        private blockchainService: BlockchainService,
        private bitcoinService: BitcoinService
    ) { }

    async usdRate(wallet: string, side: string) {
        const ngnRate: number = await this.binanceService.getPrice(wallet, 'NGN');
        const usdRate: number = await this.binanceService.getPrice(wallet, 'USDT');

        return {
            'ngnRate': ngnRate,
            'usdRate': usdRate
        };
    }

    async sendCoins(sco: SendCoinsRequestObject) {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService.loginNoHash(sco.emailAddress, sco.password);
                const addressMapping: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === WALLET_TYPE[sco.fromCoin];
                });
                if (await this.blockchainService.checkBalance(sco.fromCoin, user, sco.amountToSend)) {
                    await this.bitcoinService.send(addressMapping, sco.buyerToAddress, sco.amountToSend, sco.xendFees, sco.blockFees);
                }

                resolve('ok');
            } catch (e) {
                reject(e);
            }
        });
    }

    async trade(tro: TradeRequestObject) {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService.loginNoHash(tro.emailAddress, tro.password);
                if (await this.blockchainService.checkBalance(tro.fromCoin, user, tro.amountToSpend)) {
                    switch (tro.orderType) {
                        case 'P2P':
                            // TODO
                            break;
                        case 'MO':
                            this.binanceService.sellTrade(tro, user);
                            break;
                    }
                }
                // const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                //     return x.chain === tro.fromCoin;
                // })
            } catch (e) {
                reject(e);
            }
        });
    }
}
