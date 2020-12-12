import { Injectable } from '@nestjs/common';
import { BinanceService } from '../binance/binance.service';

@Injectable()
export class ExchangeService {
    constructor(private binanceService: BinanceService) {}

    async usdRate(wallet: string, side: string) {        
        const ngnRate: number = await this.binanceService.getPrice(wallet, 'NGN');
        const usdRate: number = await this.binanceService.getPrice(wallet, 'USDT');

        return {
            'ngnRate': ngnRate,
            'usdRate': usdRate
        };
    }
}
