import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { address } from 'bitcoinjs-lib';
import { Roles } from 'src/decorators/roles.decorator';
import { SwapTokenRequestObject } from 'src/models/request.objects/swap.token.ro';
import { DefiService } from 'src/services/defi.service';
import { Response, ResponseUtils } from 'src/utils/response.utils';

@Controller('defi')
export class DefiController {
    constructor(private defiService: DefiService) { }

    @Get('get-tokens/:reload')
    async getToken(@Param("reload") reload: string): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.defiService.getAllTokens(reload === "true"));
    }

    @Get('get-price/:from/:to')
    async getPrice(@Param("from") from: string, @Param("to") to: string): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.defiService.getPrice(from, to));
    }    

    @Post('swap')
    @Roles('api')
    async swap(@Body() stro: SwapTokenRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.defiService.swap(stro));
    }
}
