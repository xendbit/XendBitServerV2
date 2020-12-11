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
        const user = await this.userService.addNewUser(uro).catch(error => {
            throw error;
        });
        return ResponseUtils.getSuccessResponse(user, "User Created Sucessfully");
    }

    @Post('login')
    @Roles('api')
    async login(@Body() lro: LoginRequestObject): Promise<Response> {
        const user = await this.userService.login(lro).catch(error => {
            throw error;
        });

        return ResponseUtils.getSuccessResponse(user, "Login Successful");
    }

    @Get('confirm-email/:tag')
    async confirmEmail(@Param('tag') tag: string): Promise<string> {
        return await this.userService.confirmEmail(tag);
    }

    @Post('balance')
    async balance(@Req() req, @Body() lro: LoginRequestObject): Promise<Response> {
        const wallet = req.headers['wallet'];
        const balance = await this.userService.balance(lro, wallet);
        return ResponseUtils.getSuccessResponse(balance)
    }
}
