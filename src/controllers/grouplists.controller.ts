import { Body, Controller, Get, Post } from '@nestjs/common';
import { GenericRequestObject } from 'src/models/request.objects';
import { GrouplistsService } from 'src/services/grouplists.service';
import { Response, ResponseUtils } from 'src/utils/response.utils';

@Controller('config')
export class GrouplistsController {
    constructor(private grouplistsService: GrouplistsService) {}

    @Get('en.ng.json')
    getAll(): Promise<any> {
        return this.grouplistsService.findAll();
    }

    @Post('get-last-word')
    getLastWord(@Body() gro: GenericRequestObject ): Response  {
        return ResponseUtils.getSuccessResponse(this.grouplistsService.get13thWord(gro));
    }
}
