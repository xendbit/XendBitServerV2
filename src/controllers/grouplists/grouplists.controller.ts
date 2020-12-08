import { Body, Controller, Get, Post } from '@nestjs/common';
import { Grouplists } from 'src/models/grouplists.entity';
import { GenericRequestObject } from 'src/models/request.objects/generic.ro';
import { GrouplistsService } from 'src/services/grouplists/grouplists.service';

@Controller('config')
export class GrouplistsController {
    constructor(private grouplistsService: GrouplistsService) {}

    @Get('en.ng.json')
    getAll(): Promise<any> {
        return this.grouplistsService.findAll();
    }

    @Post('get-last-word')
    getLastWord(@Body() gro: GenericRequestObject ): string  {
        return this.grouplistsService.get13thWord(gro);
    }
}
