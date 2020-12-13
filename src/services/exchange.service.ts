import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { TradeRequestObject } from 'src/models/request.objects/trade.ro';
import { User } from 'src/models/user.entity';
import { Repository } from 'typeorm';
import { BinanceService } from './binance.service';
import { BlockchainService } from './blockchain.service';
import { UserService } from './user.service';

@Injectable()
export class ExchangeService {
    constructor(
        private binanceService: BinanceService,
        private userService: UserService,
        private blockchainService: BlockchainService,
        @InjectRepository(AddressMapping) private amRepo: Repository<AddressMapping>
    ) { }

    async usdRate(wallet: string, side: string) {
        const ngnRate: number = await this.binanceService.getPrice(wallet, 'NGN');
        const usdRate: number = await this.binanceService.getPrice(wallet, 'USDT');

        return {
            'ngnRate': ngnRate,
            'usdRate': usdRate
        };
    }

    async trade(tro: TradeRequestObject) {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService._loginNoHash(tro.emailAddress, tro.password);
                if (await this.blockchainService.checkBalance(tro.fromCoin, user, tro.amountToSpend)) {
                    switch (tro.orderType) {
                        case 'P2P':
                            // TODO
                            break;
                        case 'MO':
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
