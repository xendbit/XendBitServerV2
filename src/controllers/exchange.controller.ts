import { Controller, Get, Param } from '@nestjs/common';
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
}
