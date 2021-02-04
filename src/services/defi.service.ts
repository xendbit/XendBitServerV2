import { Injectable, Logger } from '@nestjs/common';
import { ChainId, Token, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Pair, Percent } from '@uniswap/sdk'
import { AddressMapping } from 'src/models/address.mapping.entity';
import { Config } from './config.service';
import { EthereumTokensService } from './ethereum-tokens.service';
import { UserService } from './user.service';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { UniswapToken } from 'src/models/uniswap.token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EthereumService } from './ethereum.service';
import { UserToken } from 'src/models/user.tokens.entity';
import { StakableToken } from 'src/models/stakable.token.entity';

@Injectable()
export class DefiService {
    private readonly logger = new Logger(DefiService.name);
    private httpService: HttpClient;

    @InjectRepository(UniswapToken) private uniswapTokenRepo: Repository<UniswapToken>;
    @InjectRepository(StakableToken) private stakableTokenRepo: Repository<StakableToken>;
    @InjectRepository(UserToken) private userTokenRepo: Repository<UserToken>;

    constructor(
        private config: Config,        
    ) {
        this.httpService = new HttpClient('Defi API');
    }

   async getStakableTokens(userId: number): Promise<StakableToken[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const userTokens = await this.userTokenRepo.createQueryBuilder("userToken")
                    .where("user_id = :id", { id: userId })
                    .getMany();
                const dbTokens = await this.stakableTokenRepo.find();

                let notInUserTokens: StakableToken[];

                if (userTokens === undefined || userTokens.length <= 0) {
                    notInUserTokens = dbTokens;
                } else {
                    notInUserTokens = dbTokens.filter(x => {
                        const found = userTokens.find(y => {
                            return ((y.address === x.address) && (y.symbol === x.symbol))
                        });

                        return found === undefined;
                    });
                }

                if(notInUserTokens === undefined || notInUserTokens.length <= 0) {
                    this.logger.debug('Got All Tokens...');
                } else {
                    notInUserTokens.forEach(async (x) => {
                        let userToken: UserToken = {
                            address: x.address,
                            decimals: x.decimals,
                            logoURI: x.logoURI,
                            name: x.name,
                            symbol: x.symbol,
                            userId: userId
                        }

                        userToken = await this.userTokenRepo.save(userToken);
                    });
                }

                resolve(dbTokens);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAllTokens(reload: boolean): Promise<UniswapToken[]> {
        return new Promise(async (resolve, reject) => {
            try {
                if (reload) {
                    const url = this.config.p['uniswap.tokens.list.url'];
                    this.logger.debug("URL: " + url);
                    const res = await this.httpService.get(url);
                    const uniswapTokens: UniswapToken[] = [];
                    if (res.message.statusCode === 200) {
                        const body = await res.readBody();
                        const parsed = JSON.parse(body);
                        const tokens: any[] = parsed.tokens;
                        for (let x of tokens) {
                            const token: UniswapToken = {
                                chainId: x.chainId,
                                address: x.address,
                                decimals: x.decimals,
                                name: x.name,
                                symbol: x.symbol,
                                logoURI: x.logoURI
                            }

                            this._addToDB(token);

                            uniswapTokens.push(token);
                        }
                        resolve(uniswapTokens)
                    } else {
                        resolve([]);
                    }
                } else {
                    const dbTokens = await this.uniswapTokenRepo.find();
                    resolve(dbTokens);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async _addToDB(token) {
        const dbToken = await this.uniswapTokenRepo.createQueryBuilder("uniswapToken")
            .where("chain_id = :cid", { cid: token.chainId })
            .andWhere("address = :add", { add: token.address })
            .andWhere("name = :name", { name: token.name })
            .andWhere("symbol = :sym", { sym: token.symbol })
            .getOne();

        if (dbToken === undefined) {
            this.uniswapTokenRepo.save(token);
        }
    }

}