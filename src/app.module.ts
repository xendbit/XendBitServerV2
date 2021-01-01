import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Grouplists } from './models/grouplists.entity';
import { User } from './models/user.entity';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { AddressMapping } from './models/address.mapping.entity';
import { BitcoinService } from './services/bitcoin.service';
import { Config } from './services/config.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './services/email.service';
import { Exchange } from './models/exchange.entity';
import { ExchangeController } from './controllers/exchange.controller';
import { BinanceService } from './services/binance.service';
import { GrouplistsService } from './services/grouplists.service';
import { UserService } from './services/user.service';
import { MoneyWaveService } from './services/money-wave.service';
import { ProvidusBankService } from './services/providus-bank.service';
import { EthereumService } from './services/ethereum.service';
import { XendChainService } from './services/xendchain.service';
import { ImageService } from './services/image.service';
import { ExchangeService } from './services/exchange.service';
import { BlockchainService } from './services/blockchain.service';
import { GrouplistsController } from './controllers/grouplists.controller';
import { UserController } from './controllers/user.controller';
import { BinanceOrder } from './models/binance.order.entity';
import { EthereumTokensService } from './services/ethereum-tokens.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([Grouplists, User, AddressMapping, Exchange, BinanceOrder]),
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
    BinanceService,
    BlockchainService,
    EthereumTokensService
  ],
})
export class AppModule { }
