import { Injectable, Logger } from '@nestjs/common';
import { v4 as randomUUID } from 'uuid';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { Exchange } from 'src/models/exchange.entity';
import { SendCoinsRequestObject } from 'src/models/request.objects/send.coins.ro';
import { TradeRequestObject } from 'src/models/request.objects/trade.ro';
import { User } from 'src/models/user.entity';
import { BinanceService } from './binance.service';
import { BitcoinService } from './bitcoin.service';
import { BlockchainService } from './blockchain.service';
import { Config } from './config.service';
import { UserService } from './user.service';
import { XendChainService } from './xendchain.service';
import { STATUS, WALLET_TYPE } from 'src/utils/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExchangeService {
    private readonly logger = new Logger(ExchangeService.name);
    @InjectRepository(Exchange)
    private exchangeRepo: Repository<Exchange>;

    constructor(
        private binanceService: BinanceService,
        private userService: UserService,
        private blockchainService: BlockchainService,
        private bitcoinService: BitcoinService,
        private xendService: XendChainService,      
        private config: Config  
    ) { }

    async usdRate(wallet: string, side: string) {
        const ngnRate: number = await this.binanceService.getPrice(wallet, 'NGN');
        const usdRate: number = await this.binanceService.getPrice(wallet, 'USDT');

        return {
            'ngnRate': ngnRate,
            'usdRate': usdRate
        };
    }

    async sendCoins(sco: SendCoinsRequestObject) {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService.loginNoHash(sco.emailAddress, sco.password);
                const addressMapping: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === WALLET_TYPE[sco.fromCoin];
                });
                if (await this.blockchainService.checkBalance(sco.fromCoin, user, sco.amountToSend)) {
                    await this.bitcoinService.send(addressMapping, sco.buyerToAddress, sco.amountToSend, sco.xendFees, sco.blockFees);
                }

                resolve('ok');
            } catch (e) {
                reject(e);
            }
        });
    }

    async buyTrade(tro: TradeRequestObject): Promise<string> {
        return new Promise(async (resolve, reject) => {
            // TODO: Delete this lines
            //tro.amountToSpend = 5000;
            //tro.amountToGet = tro.amountToGet / 10;    

            try {
                const user: User = await this.userService.loginNoHash(tro.emailAddress, tro.password);
                const ethAM: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === WALLET_TYPE.ETH
                });
                
                if(await this.xendService.checkNgncBalance(ethAM.chainAddress, tro.amountToSpend)) {
                    // send ngnc to us
                    const xendAddress = this.config.p["xend.address"];
                    const trxHash = await this.xendService.sendNgnc(ethAM, xendAddress, tro.amountToSpend);
                    
                    this.logger.debug(`Send NGNC Hash: ${trxHash}`);

                    await this.binanceService.buyTrade(tro, user);
                }

                resolve("success");
            } catch (e) {
                reject(e);
            }
        });
    }

    async sellTrade(tro: TradeRequestObject): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userService.loginNoHash(tro.emailAddress, tro.password);
                //if (await this.blockchainService.checkBalance(tro.fromCoin, user, tro.amountToSpend)) {
                    switch (tro.orderType) {
                        case 'P2P':
                            await this._sellTradeP2P(tro, user);                            
                            break;
                        case 'MO':
                            await this.binanceService.sellTrade(tro, user);
                            break;
                    }
                //}

                resolve("success");
            } catch (e) {
                reject(e);
            }
        });
    }

    async _sellTradeP2P(tro: TradeRequestObject, user: User) {
        let exchange: Exchange = {
            active: true,
            amountToRecieve: tro.amountToGet,
            amountToSell: tro.amountToSpend,
            blockFees: tro.blockFees,
            buyer: null,
            seller: user,
            buyerFromAddress: "",
            buyerToAddress: "",
            datetime: new Date().getTime(),
            fees: tro.fees,
            fromCoin: tro.fromCoin,
            rate: tro.rate,
            sellerFromAddress: tro.sellerFromAddress === undefined ? "" : tro.sellerFromAddress,
            sellerToAddress: tro.sellerToAddress,
            status: STATUS.ORDER_PLACED,
            toCoin: tro.toCoin,
            trxHex: "",
            trxId: randomUUID(),
            xendFees: tro.xendFees        
        }

        exchange = await this.exchangeRepo.save(exchange);         
    }
}
