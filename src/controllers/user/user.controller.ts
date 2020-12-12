import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { LoginRequestObject } from 'src/models/request.objects/login.ro';
import { UserRequestObject } from 'src/models/request.objects/new.user.ro';
import { UserService } from 'src/services/user/user.service';
import { Response, ResponseUtils } from 'src/utils/response.utils';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    @Post('new')
    @Roles('api')
    async newUser(@Body() uro: UserRequestObject): Promise<Response> {
        const result = await this.userService.addNewUser(uro).catch(error => {
            throw error;
        });
        return ResponseUtils.getSuccessResponse(result, "User Created Sucessfully");
    }

    @Post('login')
    @Roles('api')
    async login(@Body() lro: LoginRequestObject): Promise<Response> {
        const result = await this.userService.login(lro).catch(error => {
            throw error;
        });

        return ResponseUtils.getSuccessResponse(result, "Login Successful");
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
}
