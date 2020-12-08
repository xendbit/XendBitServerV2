import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GrouplistsService } from './services/grouplists/grouplists.service';
import { GrouplistsController } from './controllers/grouplists/grouplists.controller';
import { Grouplists } from './models/grouplists.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([Grouplists])
  ],
  controllers: [AppController, GrouplistsController],
  providers: [AppService, GrouplistsService],
})
export class AppModule {}
