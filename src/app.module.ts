import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GrouplistsService } from './services/grouplists/grouplists.service';
import { GrouplistsController } from './controllers/grouplists/grouplists.controller';
import { Grouplists } from './models/grouplists.entity';
import { UserController } from './controllers/user/user.controller';
import { UserService } from './services/user/user.service';
import { User } from './models/user.entity';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { MoneyWaveService } from './services/money-wave/money-wave.service';
import { ProvidusBankService } from './services/providus-bank/providus-bank.service';
import { AddressMapping } from './models/address.mapping.entity';
import { BitcoinUtils } from './utils/bitcoin.utils';
import { EthereumUtils } from './utils/ethereum.utils';
import { Config } from './utils/config';
import { XendChainUtils } from './utils/xendchain.utils';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './services/email/email.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([Grouplists, User, AddressMapping]),
    MailerModule.forRoot({  
      transport: 'smtps://contact@xendbit.com:jugDy4-wygmyh-fintoc@smtp.gmail.com',
      defaults: {
        from: '"Contact XendBit" <contact@xendbit.com>',
      },
    }),
  ],
  controllers: [AppController, GrouplistsController, UserController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    AppService,
    GrouplistsService,
    UserService,
    MoneyWaveService,
    ProvidusBankService,
    BitcoinUtils,
    EthereumUtils,
    Config,
    XendChainUtils,
    EmailService
  ],
})
export class AppModule { }
