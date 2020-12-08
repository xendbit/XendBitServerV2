import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Grouplists } from 'src/models/grouplists.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GrouplistsService {
    private readonly logger = new Logger(GrouplistsService.name);
    constructor(@InjectRepository(Grouplists) private glRepo: Repository<Grouplists>) {}

    findAll(): Promise<any> {        
        return this.getProperties();
    }

    async getProperties() {
        const p1 = await this.getProperty(100);
        const p2 = await this.getProperty(200);
        const p3= await this.getProperty(300);

        const result = {
            "payment.methods": p1,
            "id.types": p2,
            "banks": p3
        }

        return result;
    }

    async getProperty(glId: number): Promise<Object[]> {
        const query = "SELECT value FROM XB_GL WHERE gl_id = ?";
        const glValues = await this.glRepo.query(query, [glId]);
        const result = [];
        glValues.forEach(glv => {
            result.push(JSON.parse(glv.value));
        });

        return result;
    }
}
