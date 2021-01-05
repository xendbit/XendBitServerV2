import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AddressMapping } from "src/models/address.mapping.entity";
import { BinanceOrder } from "src/models/binance.order.entity";
import { Exchange } from "src/models/exchange.entity";
import { TradeRequestObject } from "src/models/request.objects/trade.ro";
import { User } from "src/models/user.entity";
import { STATUS, WALLET_TYPE } from "src/utils/enums";
import { Repository } from "typeorm";
import { BitcoinService } from "./bitcoin.service";
import { Config } from "./config.service";
import { EthereumTokensService } from "./ethereum-tokens.service";
import { EthereumService } from "./ethereum.service";

@Injectable()
export class BlockchainService {
    private readonly logger = new Logger(BlockchainService.name);
    @InjectRepository(Exchange) private exchangeRepo: Repository<Exchange>;
    @InjectRepository(BinanceOrder) private binanceRepo: Repository<BinanceOrder>;
    
    constructor(
        private bitcoinService: BitcoinService,
        private ethereumService: EthereumService,
        private ethereumTokensService: EthereumTokensService,
        private config: Config,
    ) { }

    async sendToken(sender: AddressMapping, recipient: string, amount: number, xendFees: number, blockFees: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                switch (sender.chain) {
                    case WALLET_TYPE.BTC:
                        resolve(await this.bitcoinService.send(sender, recipient, amount, xendFees, blockFees));
                    case WALLET_TYPE.ETH:
                        resolve(await this.ethereumService.send(sender, recipient, amount, xendFees, blockFees));
                        break;
                    case WALLET_TYPE.USDT:
                    case WALLET_TYPE.LINK:
                        resolve(await this.ethereumTokensService.sendToken(sender, recipient, amount))
                        break;
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async history(address: string, coin: WALLET_TYPE): Promise<History[]> {
        return new Promise(async (resolve, reject) => {
            try {
                switch (coin) {
                    case WALLET_TYPE.BTC:
                        resolve(this.bitcoinService.history(address));
                        break;
                    case WALLET_TYPE.ETH:
                        resolve(this.ethereumService.history(address));
                        break;
                    case WALLET_TYPE.LINK:
                        resolve(this.ethereumTokensService.history(address, this.config.p.LINK["contract.address"]));
                        break;
                    case WALLET_TYPE.USDT:
                        resolve(this.ethereumTokensService.history(address, this.config.p.USDT["contract.address"]));
                        break;
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async checkBalance(wallet: string, user: User, compareBalance: number): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                let balance = 0;
                const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === wallet;
                });

                switch (wallet) {
                    case WALLET_TYPE.BTC:
                        balance = await this.bitcoinService.getBalance([am.chainAddress]);
                        break;
                    case WALLET_TYPE.ETH:
                        balance = await this.ethereumService.getBalance(am.chainAddress);
                    case WALLET_TYPE.USDT:
                    case WALLET_TYPE.LINK:
                        balance = await this.ethereumTokensService.getBalance(am);
                        break;
                    default:
                        break;
                }

                if (compareBalance > balance) {
                    throw Error(`Insufficient ${wallet} balance.`);
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getBalance(wallet: string, user: User): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                let balance = 0;
                const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === wallet;
                });
                //const escrow = await this.getEscrow(wallet, user.id);
                switch (wallet) {
                    case WALLET_TYPE.BTC:
                        balance = await this.bitcoinService.getBalance([am.chainAddress]);
                        //balance -= escrow;
                        break;
                    case WALLET_TYPE.ETH:
                        balance = await this.ethereumService.getBalance(am.chainAddress);
                        //balance -= escrow;
                        break;
                    case WALLET_TYPE.USDT:
                    case WALLET_TYPE.LINK:
                        balance = await this.ethereumTokensService.getBalance(am);
                        break;
                }

                resolve({
                    balance: balance,
                    escrow: 0
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getFees(user: User): AddressMapping[] {
        const ams: AddressMapping[] = [];
        let tokenMappings: AddressMapping[] = [];
        user.addressMappings.forEach(am => {
            switch (am.chain) {
                case WALLET_TYPE.BTC:
                    am.fees = this.bitcoinService.getFees(am);
                    break;
                case WALLET_TYPE.ETH:
                    am.fees = this.ethereumService.getFees(am);
                    tokenMappings = this.ethereumTokensService.getTokens(am);
                    break;
            }
            ams.push(am);
        });

        tokenMappings.forEach(tm => {
            ams.push(tm);
        });

        return ams;
    }

    async getEscrow(coin: string, sellerId): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const ex = await this.exchangeRepo
                    .createQueryBuilder("exchange")
                    .where("exchange.active = true")
                    .andWhere("exchange.from_coin = :coin", { coin: coin })
                    .andWhere("exchange.status IN ('ORDER_PLACED', 'BUYER_PAID')")
                    .andWhere("exchange.sellerId = :sellerId", { sellerId: sellerId })
                    .leftJoinAndSelect("exchange.seller", "seller")
                    .getMany();

                if (ex.length === 0) {
                    resolve(0);
                }

                resolve(ex.map((x) => {
                    return x.amountToSell + x.blockFees + x.xendFees;
                }).reduce((sum: number, x: number) => {
                    return sum += x;
                }));
            } catch (error) {
                reject(error);
            }
        });
    }

    async sendTrade(bo: BinanceOrder, tro: TradeRequestObject, sender: AddressMapping, depositAddress: string): Promise<boolean> {
        this.logger.debug(`Sending ${tro.amountToSpend} to ${depositAddress}`);
        return new Promise(async (resolve, reject) => {
            try {
                switch (tro.fromCoin) {
                    case WALLET_TYPE.BTC:
                        await this.bitcoinService.send(sender, depositAddress, tro.amountToSpend, tro.xendFees, tro.blockFees);
                        bo.status = STATUS.SENT_TO_BINANCE;
                        bo = await this.binanceRepo.save(bo);
                        break;
                    case WALLET_TYPE.ETH:
                        await this.ethereumService.send(sender, depositAddress, tro.amountToSpend, tro.xendFees, tro.blockFees);
                        bo.status = STATUS.SENT_TO_BINANCE;
                        bo = await this.binanceRepo.save(bo);
                        break;
                    case WALLET_TYPE.USDT:
                    case WALLET_TYPE.LINK:
                        await this.ethereumTokensService.sendToken(sender, depositAddress, tro.amountToSpend);
                        bo.status = STATUS.SENT_TO_BINANCE;
                        bo = await this.binanceRepo.save(bo);
                        break;
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export class History {
    hash: string;
    value: number;
    date: string;
    status: string;
}