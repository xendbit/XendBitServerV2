import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { SwapTokenRequestObject } from 'src/models/request.objects';
import { DefiService } from 'src/services/defi.service';
import { UniswapService } from 'src/services/uniswap.service';
import { Response, ResponseUtils } from 'src/utils/response.utils';

@Controller('defi')
export class DefiController {
    constructor(
        private defiService: DefiService,
        private uniswapService: UniswapService
    ) { }

    @Get('get-tokens/:reload')
    async getToken(@Param("reload") reload: string): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.defiService.getAllTokens(reload === "true"));
    }

    @Get('get-stakable-tokens/:id')
    async getStakableToken(@Param("id") userId: number): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.defiService.getStakableTokens(userId));
    }    

    @Get('get-price/:from/:to')
    async getPrice(@Param("from") from: string, @Param("to") to: string): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.uniswapService.getPrice(from, to));
    }    

    @Post('swap')
    @Roles('api')
    async swap(@Body() stro: SwapTokenRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.uniswapService.swap(stro));
    }
}
