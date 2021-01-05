import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { OrdersRequest } from 'src/models/request.objects/orders.ro';
import { SendCoinsRequestObject } from 'src/models/request.objects/send.coins.ro';
import { TradeRequestObject } from 'src/models/request.objects/trade.ro';
import { ExchangeService } from 'src/services/exchange.service';
import { Response, ResponseUtils } from 'src/utils/response.utils';

@Controller('exchange')
export class ExchangeController {
    constructor(private exchangeService: ExchangeService) {}

    @Get('usd-rate/:wallet/:side')    
    async usdRate(@Param("wallet") wallet: string, @Param("side") side: string): Promise<Response> {
        const result = await this.exchangeService.usdRate(wallet, side);
        return ResponseUtils.getSuccessResponse(result);
    }

    @Post('send-coins')
    @Roles('api')
    async sendCoins(@Body() sco: SendCoinsRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.exchangeService.sendCoins(sco));
    }

    @Post('my-sell-orders')
    @Roles('api')
    async sellOrders(@Body() or: OrdersRequest): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.exchangeService.sellOrders(or));
    }    

    @Post('my-sell-orders/update')
    @Roles('api')
    async updateSellOrders(@Body() or: OrdersRequest): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.exchangeService.updateSellOrders(or));
    }    

    @Post('sell-trade')
    @Roles('api')
    async sellTrade(@Body() tro: TradeRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.exchangeService.sellTrade(tro));
    }

    @Post('buy-trade')
    @Roles('api')
    async buyTrade(@Body() tro: TradeRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.exchangeService.buyTrade(tro));
    }    
}
