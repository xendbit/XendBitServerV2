import { Injectable, Logger } from '@nestjs/common';
import { Binance, Order, OrderType, WithrawResponse } from 'binance-api-node';
import { v4 as randomUUID } from 'uuid';
import { User } from 'src/models/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BinanceOrder } from 'src/models/binance.order.entity';
import { Repository } from 'typeorm';
import { STATUS } from 'src/utils/enums';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { XendChainService } from './xendchain.service';
import { BlockchainService } from './blockchain.service';
import { EmailService } from './email.service';
import { TradeRequestObject } from 'src/models/request.objects';

const BinanceDefault = require('binance-api-node').default

@Injectable()
export class BinanceService {
    client: Binance = BinanceDefault({
        apiKey: process.env.BINANCE_API_KEY,
        apiSecret: process.env.BINANCE_API_SECRET,
    });

    private readonly logger = new Logger(BinanceService.name);
    @InjectRepository(BinanceOrder) private binanceRepo: Repository<BinanceOrder>;

    constructor(
        private blockchainService: BlockchainService,
        private xendService: XendChainService,
        private emailService: EmailService,
    ) {
        this.client.exchangeInfo().then(x => {
            //this.logger.debug(x);
            const bnbInfo = [];
            for (let a of x.symbols) {
                if (a.symbol === 'BNBUSDT') {
                    bnbInfo.push(a);
                }
            }
            this.logger.debug(bnbInfo[0].baseAssetPrecision);
        });
    }

    async getPrecision(symbol: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            const ei = await this.client.exchangeInfo();
            const symbols = ei.symbols;
            for (let a of symbols) {
                if (a.symbol === 'BNBUSDT') {
                    resolve(a.baseAssetPrecision);
                    break;
                }
            }
        });
    }

    async getPrice(chain: string, currency: string): Promise<number> {
        const symbol = `${chain.toUpperCase()}${currency.toUpperCase()}`
        this.logger.debug(`Getting Price for Symbol: ${symbol}`);
        const result = await this.client.prices({ symbol: symbol });
        this.logger.debug(result);
        return +result[symbol];
    }

    async buyTrade(tro: TradeRequestObject, user: User): Promise<string> {
        return new Promise(async (resolve, reject) => {

            let bo: BinanceOrder = {
                clientId: randomUUID(),
                coin: tro.fromCoin,
                price: tro.rate,
                quantity: tro.amountToSpend,
                quoteOrderQty: tro.amountToGet,
                side: tro.side,
                status: STATUS.ORDER_PLACED,
                fetchCoinDate: Date.now(),
                fetchedCoin: false,
                timestamp: new Date().getTime(),
                user: user
            }

            try {
                bo = await this.binanceRepo.save(bo);

                const symbol = tro.toCoin + 'USDT';
                const precision = await this.getPrecision(symbol);

                this.client.ws.user(async (msg) => {
                    if (msg.eventType === "balanceUpdate") {
                        try {
                            this.logger.debug(`Asset: ` + msg.asset);
                            this.logger.debug(`Balance: ` + msg.balanceDelta);
                            this.logger.debug(`Quantity: ` + bo.quantity);
                            if (msg.asset.toLocaleLowerCase() === 'usdt') {
                                if (+msg.balanceDelta === bo.quantity) {
                                    bo = await this.binanceRepo.createQueryBuilder("binanceOrder")
                                        .where("client_id = :cid", { cid: bo.clientId })
                                        .getOne();
                                    if (bo.status !== STATUS.SUCCESS) {

                                        const orderReponse: Order = await this.client.order({
                                            quantity: bo.quoteOrderQty.toFixed(precision),
                                            side: bo.side,
                                            symbol: symbol,
                                            type: OrderType.MARKET,
                                            newClientOrderId: bo.clientId
                                        });
                                        bo.status = STATUS.MARKET_ORDER_PLACED
                                        bo = await this.binanceRepo.save(bo);

                                        if (orderReponse.status === 'FILLED') {
                                            const filled = orderReponse.fills.map(fill => {
                                                const value: number = (+fill.price * +fill.qty) - +fill.commission;
                                                return value;
                                            }).reduce((sum: number, x: number) => {
                                                return sum += x;
                                            });
                                            bo.status = STATUS.ORDER_FILLED
                                            bo = await this.binanceRepo.save(bo);

                                            // withdraw it    
                                            const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                                                return x.chain.toLowerCase() === bo.coin.toLowerCase();
                                            });

                                            const wr: WithrawResponse = await this.client.withdraw({
                                                address: am.chainAddress,
                                                amount: filled,
                                                coin: bo.coin,
                                            });

                                            if (wr.id) {
                                                bo.status = STATUS.SUCCESS;
                                            } else {
                                                bo.status = STATUS.FAILURE;
                                            }
                                            bo = await this.binanceRepo.save(bo);
                                        } else {
                                            bo.status = STATUS.MARKET_ORDER_PENDING;
                                            bo = await this.binanceRepo.save(bo);
                                        }
                                    } else {
                                        this.logger.debug("Order Already Successfully Processed");
                                    }
                                } else {
                                    this.logger.debug(`${msg.balanceDelta} is not equal ${bo.quantity}`);
                                }
                            } else {
                                this.logger.debug('Not the same asset');
                            }
                        } catch (e) {
                            bo.status = STATUS.FAILURE;
                            await this.binanceRepo.save(bo);
                        }
                    }
                });

                const depositAddress = await this.client.depositAddress({ coin: 'USDT' });
                const sender: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain.toLowerCase() === 'usdt';
                });
                this.logger.debug("Sender In Buy: " + sender);
                await this.blockchainService.sendTrade(bo, tro, sender, depositAddress.address);

                resolve("success");
            } catch (error) {
                reject(error);
            } finally {
                bo.user = user;
                await this.emailService.sendBinanceEmail(bo);
            }
        });
    }

    async sellTrade(tro: TradeRequestObject, user: User): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let bo: BinanceOrder = {
                clientId: randomUUID(),
                coin: tro.fromCoin,
                price: tro.rate,
                quantity: tro.amountToSpend,
                quoteOrderQty: tro.amountToGet,
                side: tro.side,
                status: STATUS.ORDER_PLACED,
                timestamp: new Date().getTime(),
                fetchCoinDate: Date.now(),
                fetchedCoin: false,
                user: user
            }

            try {

                bo = await this.binanceRepo.save(bo);

                const coin = bo.coin.toString();

                const depositAddress = await this.client.depositAddress({ coin: bo.coin });

                const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain.toUpperCase() === 'ETH';
                });

                this.client.ws.user(async (msg) => {
                    if (msg.eventType === "balanceUpdate") {
                        try {
                            this.logger.debug(`Asset: ` + msg.asset);
                            this.logger.debug(`Balance: ` + msg.balanceDelta);
                            this.logger.debug(`Quantity: ` + bo.quantity);
                            if (msg.asset === tro.fromCoin) {
                                if (+msg.balanceDelta === bo.quantity) {
                                    bo = await this.binanceRepo.createQueryBuilder("binanceOrder")
                                        .where("client_id = :cid", { cid: bo.clientId })
                                        .getOne();
                                    if (bo.status !== STATUS.SUCCESS) {
                                        bo.status = STATUS.SENT_TO_BINANCE_CONFIRMED;
                                        bo = await this.binanceRepo.save(bo);
                                        const symbol = bo.coin + "USDT";
                                        // post a market order on binance
                                        const precision = await this.getPrecision(symbol);
                                        const orderReponse: Order = await this.client.order({
                                            quantity: bo.quantity.toFixed(precision),
                                            side: bo.side,
                                            symbol: symbol,
                                            type: OrderType.MARKET,
                                            newClientOrderId: bo.clientId
                                        });
                                        if (orderReponse.status === 'FILLED') {
                                            const filled = orderReponse.fills.map(fill => {
                                                const value: number = (+fill.price * +fill.qty) - +fill.commission;
                                                return value;
                                            }).reduce((sum: number, x: number) => {
                                                return sum += x;
                                            });

                                            this.logger.debug(`Sending ${filled} to ${am.chainAddress}`);

                                            const wr: WithrawResponse = await this.client.withdraw({
                                                address: am.chainAddress,
                                                amount: filled,
                                                coin: 'USDT',
                                            });

                                            if (wr.id) {
                                                bo.status = STATUS.SUCCESS;
                                            } else {
                                                bo.status = STATUS.FAILURE;
                                            }
                                            bo = await this.binanceRepo.save(bo);

                                            //await this.xendService.fundNgnc(am.chainAddress, Math.round(filled));
                                            //bo.status = STATUS.SUCCESS;
                                            //await this.binanceRepo.save(bo);
                                        } else {
                                            this.logger.debug(orderReponse.status);
                                        }
                                    } else {
                                        this.logger.debug("Order Already Successfully Processed");
                                    }
                                } else {
                                    this.logger.debug(`${msg.balanceDelta} is not equal ${bo.quantity}`);
                                }
                            } else {
                                this.logger.debug('Not the same asset');
                            }
                        } catch (e) {
                            bo.status = STATUS.FAILURE;
                            await this.binanceRepo.save(bo);
                        }
                    }
                });

                const sender: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain.toLowerCase() === tro.fromCoin.toLowerCase()
                });
                await this.blockchainService.sendTrade(bo, tro, sender, depositAddress.address);
                resolve("success");
            } catch (error) {
                reject(error);
            } finally {
                bo.user = user;
                await this.emailService.sendBinanceEmail(bo);
            }
        });
    }
}
