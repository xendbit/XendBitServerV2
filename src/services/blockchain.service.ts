import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { send } from "process";
import { AddressMapping } from "src/models/address.mapping.entity";
import { BinanceOrder } from "src/models/binance.order.entity";
import { Exchange } from "src/models/exchange.entity";
import { TradeRequestObject } from "src/models/request.objects/trade.ro";
import { User } from "src/models/user.entity";
import { STATUS, WALLET_TYPE } from "src/utils/enums";
import { Repository } from "typeorm";
import { BitcoinService } from "./bitcoin.service";
import { EthereumService } from "./ethereum.service";

@Injectable()
export class BlockchainService {
    private readonly logger = new Logger(BlockchainService.name);
    @InjectRepository(Exchange) private exchangeRepo: Repository<Exchange>;
    @InjectRepository(BinanceOrder) private binanceRepo: Repository<BinanceOrder>;
    constructor(
        private bitcoinService: BitcoinService,
        private ethereumService: EthereumService,
    ) { }

    async sendToken(sender: AddressMapping, recipient: string, amount: number, xendFees: number, blockFees: number): Promise<any> {
        switch (sender.chain) {
            case WALLET_TYPE.BTC:
                return this.bitcoinService.send(sender, recipient, amount, xendFees, blockFees);
            case WALLET_TYPE.ETH:
                break;
        }
    }

    async checkBalance(wallet: string, user: User, compareBalance: number): Promise<boolean> {
        let balance = 0;
        let address = user.addressMappings.find((x: AddressMapping) => {
            return x.chain === wallet;
        }).chainAddress;

        switch (wallet) {
            case WALLET_TYPE.BTC:
                balance = await this.bitcoinService.getBalance([address]);
                break;
            case WALLET_TYPE.ETH:
                balance = await this.ethereumService.getBalance(address);
            default:
                break;
        }

        if (compareBalance > balance) {
            throw Error(`Insufficient ${wallet} balance.`);
        }

        return true;
    }

    async getBalance(wallet: string, user: User): Promise<any> {
        let balance = 0;
        const address = user.addressMappings.find((x: AddressMapping) => {
            return x.chain === wallet;
        }).chainAddress;
        const escrow = await this.getEscrow(wallet, user.id);
        switch (wallet) {
            case WALLET_TYPE.BTC:
                balance = await this.bitcoinService.getBalance([address]);
                balance -= escrow;
                break;
            case WALLET_TYPE.ETH:
                balance = await this.ethereumService.getBalance(address);
                balance -= escrow;
                break;
        }

        return {
            balance: balance,
            escrow: escrow
        };
    }

    getFees(user: User): AddressMapping[] {
        const ams: AddressMapping[] = [];
        user.addressMappings.forEach(am => {
            switch (am.chain) {
                case WALLET_TYPE.BTC:
                    am.fees = this.bitcoinService.getFees(am);
                    break;
                case WALLET_TYPE.ETH:
                    am.fees = this.ethereumService.getFees(am);
                    break;

            }
            ams.push(am);
        });

        return ams;
    }

    async getEscrow(coin: string, sellerId): Promise<number> {
        const ex = await this.exchangeRepo
            .createQueryBuilder("exchange")
            .where("exchange.active = true")
            .andWhere("exchange.from_coin = :coin", { coin: coin })
            .andWhere("exchange.status IN ('ORDER_PLACED', 'BUYER_PAID')")
            .andWhere("exchange.sellerId = :sellerId", { sellerId: sellerId })
            .leftJoinAndSelect("exchange.seller", "seller")
            .getMany();

        if (ex.length === 0) {
            return 0;
        }

        return ex.map((x) => {
            return x.amountToSell + x.blockFees + x.xendFees;
        }).reduce((sum: number, x: number) => {
            return sum += x;
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
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }
}