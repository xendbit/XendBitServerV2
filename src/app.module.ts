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
import { DefiService } from './services/defi.service';
import { DefiController } from './controllers/defi.controller';
import { UniswapToken } from './models/uniswap.token.entity';
import { UserToken } from './models/user.tokens.entity';
import { Withdraw } from './models/withdraw.entity';
import { StakableToken } from './models/stakable.token.entity';
import { SynthetixService } from './services/synthetix.service';
import { UniswapService } from './services/uniswap.service';
require('dotenv').config();

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    TypeOrmModule.forFeature([
      Grouplists, 
      User, 
      AddressMapping, 
      Exchange, 
      BinanceOrder, 
      UniswapToken, 
      UserToken, 
      Withdraw,
      StakableToken,
    ]),
    MailerModule.forRoot({
      transport: process.env.EMAIL_URL,
      defaults: {
        from: process.env.EMAIL_FROM,
      },
    }), 
  ],
  controllers: [AppController, GrouplistsController, UserController, ExchangeController, DefiController],
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
    EthereumTokensService,
    DefiService,
    SynthetixService,
    UniswapService
  ],
})
export class AppModule { }
