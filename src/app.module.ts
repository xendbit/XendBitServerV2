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
import { BitcoinService } from './services/bitcoin/bitcoin.service';
import { EthereumService } from './services/ethereum/ethereum.service';
import { Config } from './services/config/config.service';
import { XendChainService } from './services/xendchain/xendchain.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './services/email/email.service';
import { Exchange } from './models/exchange.entity';
import { ImageService } from './services/image/image.service';
import { ExchangeController } from './controllers/exchange/exchange.controller';
import { ExchangeService } from './services/exchange/exchange.service';
import { BinanceService } from './services/binance/binance.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([Grouplists, User, AddressMapping, Exchange]),
    MailerModule.forRoot({  
      transport: 'smtps://contact@xendbit.com:jugDy4-wygmyh-fintoc@smtp.gmail.com',
      defaults: {
        from: '"Contact XendBit" <contact@xendbit.com>',
      },
    }),
  ],
  controllers: [AppController, GrouplistsController, UserController, ExchangeController],
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
    BitcoinService,
    EthereumService,
    Config,
    XendChainService,
    EmailService,
    ImageService,
    ExchangeService,
    BinanceService
  ],
})
export class AppModule { }
