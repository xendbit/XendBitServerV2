import { Controller, Get } from '@nestjs/common';
import { Grouplists } from 'src/models/grouplists.entity';
import { GrouplistsService } from 'src/services/grouplists/grouplists.service';

@Controller('en.ng.json')
export class GrouplistsController {
    constructor(private grouplistsService: GrouplistsService) {}

    @Get()
    getAll(): Promise<any> {
        return this.grouplistsService.findAll();
    }
}
