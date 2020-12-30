import { Injectable, Logger } from '@nestjs/common';
import { Binance, BalanceUpdate, Order } from 'binance-api-node';
import { TradeRequestObject } from 'src/models/request.objects/trade.ro';
import { v4 as randomUUID } from 'uuid';
import { User } from 'src/models/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BinanceOrder } from 'src/models/binance.order.entity';
import { Repository } from 'typeorm';
import { STATUS, WALLET_TYPE } from 'src/utils/enums';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { XendChainService } from './xendchain.service';
import { BlockchainService } from './blockchain.service';

const BinanceDefault = require('binance-api-node').default

@Injectable()
export class BinanceService {
    client: Binance = BinanceDefault({
        apiKey: process.env.BINANCE_API_KEY,
        apiSecret: process.env.BINANCE_API_SECRET,
    });

    private readonly logger = new Logger(BinanceService.name);

    constructor(
        @InjectRepository(BinanceOrder) private binanceRepo: Repository<BinanceOrder>,
        private blockchainService: BlockchainService,
        private xendService: XendChainService
    ) {
    }

    async getPrice(chain: string, currency: string): Promise<number> {
        const symbol = `${chain.toUpperCase()}${currency.toUpperCase()}`
        const result = await this.client.prices({ symbol: symbol });
        this.logger.debug(result);
        return +result[symbol];
    }

    async sellTrade(tro: TradeRequestObject, user: User): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {

                let bo: BinanceOrder = {
                    clientId: randomUUID(),
                    coin: tro.fromCoin,
                    price: tro.rate,
                    quantity: tro.amountToSpend,
                    quoteOrderQty: tro.amountToGet,
                    side: tro.side,
                    status: STATUS.ORDER_PLACED,
                    timestamp: new Date().getTime(),
                    user: user
                }

                bo = await this.binanceRepo.save(bo);

                const coin = bo.coin.toString();

                this.client.depositAddress({ asset: coin }).then(x => {
                    this.logger.debug(x.success);
                    this.logger.debug(x.address);

                })
                const depositAddress = await this.client.depositAddress({ asset: bo.coin });
                this.logger.debug(depositAddress.success);
                this.logger.debug(depositAddress.address);

                const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === WALLET_TYPE.ETH;
                });

                this.client.ws.user(async (msg) => {
                    if (msg.eventType === "balanceUpdate") {
                        try {
                            this.logger.debug(`Balance Update Called`);
                            this.logger.debug(`Balance Delta: ${msg.balanceDelta}`);
                            if (WALLET_TYPE[msg.asset] === tro.fromCoin) {
                                if (+msg.balanceDelta === bo.quantity) {
                                    bo = await this.binanceRepo.createQueryBuilder("binanceOrder")
                                        .where("client_id = :cid", { cid: bo.clientId })
                                        .getOne();
                                    if (bo.status !== STATUS.SUCCESS) {
                                        bo.status = STATUS.SENT_TO_BINANCE_CONFIRMED;
                                        bo = await this.binanceRepo.save(bo);
                                        const symbol = bo.coin + "NGN";
                                        // post a market order on binance
                                        const orderReponse: Order = await this.client.order({
                                            quantity: bo.quantity + "",
                                            side: bo.side,
                                            symbol: symbol,
                                            type: 'MARKET',
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
                                            await this.xendService.fundNgnc(am.chainAddress, Math.round(filled));
                                            bo.status = STATUS.SUCCESS;
                                            await this.binanceRepo.save(bo);
                                            this.client
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            bo.status = STATUS.FAILURE;
                            await this.binanceRepo.save(bo);
                        }
                    }
                });

                const sender: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === tro.fromCoin
                });
                await this.blockchainService.sendTrade(bo, tro, sender, depositAddress.address);
                resolve("success");
            } catch (error) {
                reject(error);
            }
        });
    }
}
