import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Grouplists } from 'src/models/grouplists.entity';
import { GenericRequestObject } from 'src/models/request.objects/generic.ro';
import { Repository } from 'typeorm';
import { HmacSHA256 } from 'crypto-js';

@Injectable()
export class GrouplistsService {
    private readonly logger = new Logger(GrouplistsService.name);
    @InjectRepository(Grouplists) private glRepo: Repository<Grouplists>
    constructor() {}

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

    private async getProperty(glId: number): Promise<Object[]> {
        const query = "SELECT value FROM XB_GL WHERE gl_id = ?";
        const glValues = await this.glRepo.query(query, [glId]);
        const result = [];
        glValues.forEach(glv => {
            result.push(JSON.parse(glv.value));
        });

        return result;
    }

    get13thWord(gro: GenericRequestObject): string {
        const splitted = gro.passphrase.split(" ");
        let trimmed = "";
        splitted.forEach(x => {
            trimmed += x
        });

        let hash = HmacSHA256(trimmed, process.env.KEY).toString();        

        for(let i = 0; i < 13; i++) {            
            hash = HmacSHA256(hash, process.env.KEY).toString();
        }
        
        let sum = 0;
        for(let i = 0; i < hash.length; i++) {
            let ch = hash.charAt(i);
            let num = +ch;
            if(!isNaN(num)) {
                sum += num;
            }
        }

        const index = sum % splitted.length;

        return splitted[index];
    }
}
