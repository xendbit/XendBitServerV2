import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SendCoinsRequestObject } from 'src/models/request.objects/send.coins.ro';
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
    async sendCoins(@Body() sco: SendCoinsRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.exchangeService.sendCoins(sco));
    }
}
