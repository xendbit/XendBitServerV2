import { Injectable, Logger } from '@nestjs/common';
import { Binance, BalanceUpdate } from 'binance-api-node';
import { TradeRequestObject } from 'src/models/request.objects/trade.ro';
import { v4 as randomUUID } from 'uuid';
import { User } from 'src/models/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BinanceOrder } from 'src/models/binance.order.entity';
import { Repository } from 'typeorm';
import { STATUS } from 'src/utils/enums';

const BinanceDefault = require('binance-api-node').default

@Injectable()
export class BinanceService {
    client: Binance = BinanceDefault({
        apiKey: 'B21ehQsPWWpdpQhuUqxBBEQAMr4ffiCxhkzYciHi0LKCweUPXS2y6JP7sBubuB0f',
        apiSecret: 'x1TqgfJYecLjIjc29g11rkQkxCw1BK0XVB73gnlNQSvVE2xJZbnOzBOrHFQ7g8pa',
    });
    private readonly logger = new Logger(BinanceService.name);
    constructor(
        @InjectRepository(BinanceOrder) private binanceRepo: Repository<BinanceOrder>
    ) {
    }

    async getPrice(chain: string, currency: string): Promise<number> {
        const symbol = `${chain.toUpperCase()}${currency.toUpperCase()}`
        const result = await this.client.prices({ symbol: symbol });
        this.logger.debug(result);
        return +result[symbol];
    }

    async sellTrade(tro: TradeRequestObject, user: User) {
        let bo: BinanceOrder = {
            clientId: randomUUID(),
            coin: tro.fromCoin,
            price: tro.rate,
            quantity: tro.amountToSpend,
            quoteOrderQty: tro.amountToGet,
            side: tro.side,
            status: STATUS.ORDER_PLACED,
            timestamp: new Date().getTime(),
            user: user
        }

        bo = await this.binanceRepo.save(bo);
        this.client.ws.user((msg: BalanceUpdate) => {
            
        });

        const depositAddress = await (await this.client.depositAddress({asset: bo.coin})).address;
        
    }
}
