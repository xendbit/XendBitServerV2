import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { LoginRequestObject, UserRequestObject, WithdrawRequestObject } from 'src/models/request.objects';
import { UserService } from 'src/services/user.service';
import { Response, ResponseUtils } from 'src/utils/response.utils';

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService,
    ) { }

    @Post('new')
    @Roles('api')
    async newUser(@Body() uro: UserRequestObject): Promise<Response> {
        const result = await this.userService.addNewUser(uro).catch(error => {
            throw error;
        });
        return ResponseUtils.getSuccessResponse(result, "User Created Sucessfully");
    }

    @Post('send-confirmation-email')
    @Roles('api')
    async sendConfirmationEmail(@Body() lro: LoginRequestObject): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.userService.sendConfirmationEmail(lro), "Login Successful");
    }

    @Post('login')
    @Roles('api')
    async login(@Body() lro: LoginRequestObject): Promise<Response> {
        const result = await this.userService.login(lro).catch(error => {
            throw error;
        });

        return ResponseUtils.getSuccessResponse(result, "Login Successful");
    }

    @Post('recover')
    @Roles('api')
    async recover(@Body() lro: LoginRequestObject): Promise<Response> {
        const result = await this.userService.recover(lro).catch(error => {
            throw error;
        });

        return ResponseUtils.getSuccessResponse(result, "Recover Successful");
    }    

    @Get('confirm-email/:tag')
    async confirmEmail(@Param('tag') tag: string): Promise<string> {
        return await this.userService.confirmEmail(tag);
    }

    @Get('balance/:id/:wallet')
    async balance(@Param("id") id: number, @Param("wallet") wallet: string): Promise<Response> {
        const balance = await this.userService.balance(id, wallet);
        return ResponseUtils.getSuccessResponse(balance)
    }

    @Get('ngnc-balance/:id')
    async ngncBalance(@Param("id") id: number): Promise<Response> {
        const balance = await this.userService.getNgncBalance(id);
        return ResponseUtils.getSuccessResponse(balance)
    }

    @Get('confirm-withdraw/:id')
    async confirmWithdraw(@Param('id') id: number): Promise<string> {
        return await this.userService.confirmWithdrawal(id);
    }

    @Post('withdraw-ngnc')
    @Roles('api')
    async withdrawNgnc(@Body() wro: WithdrawRequestObject): Promise<Response> {        
        return ResponseUtils.getSuccessResponse(await this.userService.withdrawNgnc(wro));
    }


    @Post('fund-account/:accountNumber/:amount')
    @Roles('api')
    async fundAccount(@Param("accountNumber") accountNumber: string, @Param("amount") amount: number): Promise<Response> {        
        return ResponseUtils.getSuccessResponse(await this.userService.fundAccount(accountNumber, amount));
    }

    @Get('history/:id/:wallet')
    async history(@Param('id') id: number, @Param('wallet') wallet: string): Promise<Response> {
        return ResponseUtils.getSuccessResponse(await this.userService.history(id, wallet));
    }

}
