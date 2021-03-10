import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AddressMapping } from "src/models/address.mapping.entity";
import { BinanceOrder } from "src/models/binance.order.entity";
import { Exchange } from "src/models/exchange.entity";
import { TradeRequestObject } from "src/models/request.objects";

import { User } from "src/models/user.entity";
import { UserToken } from "src/models/user.tokens.entity";
import { STATUS } from "src/utils/enums";
import { Repository } from "typeorm";
import { BitcoinService } from "./bitcoin.service";
import { Config } from "./config.service";
import { EthereumTokensService } from "./ethereum-tokens.service";
import { EthereumService } from "./ethereum.service";
import { SynthetixService } from "./synthetix.service";

@Injectable()
export class BlockchainService {
    private readonly logger = new Logger(BlockchainService.name);
    @InjectRepository(Exchange) private exchangeRepo: Repository<Exchange>;
    @InjectRepository(BinanceOrder) private binanceRepo: Repository<BinanceOrder>;
    @InjectRepository(UserToken) private userTokenRepo: Repository<UserToken>;

    constructor(
        private bitcoinService: BitcoinService,
        private ethereumService: EthereumService,
        private ethereumTokensService: EthereumTokensService,
        private snxService: SynthetixService,
        private config: Config,
    ) { }

    async sendToken(sender: AddressMapping, recipient: string, amount: number, xendFees: number, blockFees: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                switch (sender.chain) {
                    case 'BTC':
                        resolve(await this.bitcoinService.send(sender, recipient, amount, xendFees, blockFees));
                    case 'ETH':
                        resolve(await this.ethereumService.send(sender, recipient, amount, xendFees, blockFees));
                        break;
                    default:
                        resolve(await this.ethereumTokensService.sendToken(sender, recipient, amount))
                        break;
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async history(userId: number, address: string, coin: string): Promise<History[]> {
        return new Promise(async (resolve, reject) => {
            try {
                switch (coin) {
                    case 'BTC':
                        resolve(this.bitcoinService.history(address));
                        break;
                    case 'ETH':
                        resolve(this.ethereumService.history(address));
                        break;
                    case 'LINK':
                        resolve(this.ethereumTokensService.history(address, this.config.p.LINK["contract.address"]));
                        break;
                    case 'USDT':
                        resolve(this.ethereumTokensService.history(address, this.config.p.USDT["contract.address"]));
                        break;
                    default:
                        const userToken: UserToken = await this.userTokenRepo.createQueryBuilder("userToken")
                            .where("user_id = :uid", { uid: userId })
                            .andWhere("symbol = :sym", { sym: coin })
                            .getOne();
                        resolve(this.ethereumTokensService.history(address, userToken.address));
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
                    return x.chain.toLowerCase() === wallet.toLowerCase();
                });

                switch (wallet) {
                    case 'BTC':
                        balance = await this.bitcoinService.getBalance([am.chainAddress]);
                        break;
                    case 'ETH':
                        balance = await this.ethereumService.getBalance(am.chainAddress);
                    default:
                        balance = await this.ethereumTokensService.getBalance(am);
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

    async getBurnable(wallet: string, user: User): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                let balance = 0;
                const am: AddressMapping = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain.toLowerCase() === wallet.toLowerCase();
                });
                switch(wallet) {
                    case 'SNX':
                        resolve(await this.snxService.debtBalance(am));
                }
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
                    return x.chain.toLowerCase() === wallet.toLowerCase();
                });

                switch (wallet) {
                    case 'BTC':
                        balance = await this.bitcoinService.getBalance([am.chainAddress]);
                        break;
                    case 'ETH':
                        balance = await this.ethereumService.getBalance(am.chainAddress);
                        break;
                    default:
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

    async getFees(user: User): Promise<AddressMapping[]> {
        const ams: AddressMapping[] = [];
        let tokenMappings: AddressMapping[] = [];
        let userTokenMappings: AddressMapping[] = [];
        for (let am of user.addressMappings) {
            switch (am.chain) {
                case 'BTC':
                    am.fees = this.bitcoinService.getFees(am);
                    break;
                case 'ETH':
                    am.fees = this.ethereumService.getFees(am);
                    tokenMappings = this.ethereumTokensService.getTokens(am);
                    userTokenMappings = await this.getUserTokens(user.id, am);
                    break;
            }
            ams.push(am);
        };

        tokenMappings.forEach(tm => {
            ams.push(tm);
        });

        userTokenMappings.forEach(utm => {
            ams.push(utm);
        });

        return ams;
    }

    async getUserTokens(userId: number, ethAM: AddressMapping): Promise<AddressMapping[]> {
        return new Promise(async (resolve, reject) => {
            try {

                const userTokens: UserToken[] = await this.userTokenRepo.createQueryBuilder("userToken")
                    .where("user_id = :uid", { uid: userId })
                    .getMany();
                const ams: AddressMapping[] = [];
                for (let ut of userTokens) {
                    let am = this.ethereumTokensService.getGenericToken(ethAM, ut.symbol, ut.decimals, ut.address);
                    am.fees.logoURI = ut.logoURI;
                    ams.push(am);
                }

                resolve(ams);
            } catch (error) {
                reject(error);
            }
        });

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
                    case 'BTC':
                        await this.bitcoinService.send(sender, depositAddress, tro.amountToSpend, tro.xendFees, tro.blockFees);
                        bo.status = STATUS.SENT_TO_BINANCE;
                        bo = await this.binanceRepo.save(bo);
                        break;
                    case 'ETH':
                        await this.ethereumService.send(sender, depositAddress, tro.amountToSpend, tro.xendFees, tro.blockFees);
                        bo.status = STATUS.SENT_TO_BINANCE;
                        bo = await this.binanceRepo.save(bo);
                        break;
                    default:
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