import { Injectable, Logger } from '@nestjs/common';
import {Binance} from 'binance-api-node';
const BinanceDefault = require('binance-api-node').default

@Injectable()
export class BinanceService {
    client: Binance = BinanceDefault({
        apiKey: 'B21ehQsPWWpdpQhuUqxBBEQAMr4ffiCxhkzYciHi0LKCweUPXS2y6JP7sBubuB0f',
        apiSecret: 'x1TqgfJYecLjIjc29g11rkQkxCw1BK0XVB73gnlNQSvVE2xJZbnOzBOrHFQ7g8pa',        
    });
    private readonly logger = new Logger(BinanceService.name);
    constructor() {     
    }

    async getPrice(chain: string, currency: string): Promise<number> {
        const symbol = `${chain.toUpperCase()}${currency.toUpperCase()}`
        const result = await this.client.prices({symbol: symbol});
        this.logger.debug(result);
        return +result[symbol];
    }
}
