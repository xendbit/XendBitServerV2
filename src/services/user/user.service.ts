import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { rejects } from 'assert';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { AES, enc, HmacSHA256 } from 'crypto-js';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { Exchange } from 'src/models/exchange.entity';
import { LoginRequestObject } from 'src/models/request.objects/login.ro';
import { UserRequestObject } from 'src/models/request.objects/new.user.ro';
import { User } from 'src/models/user.entity';
import { BitcoinService } from 'src/services/bitcoin/bitcoin.service';
import { EthereumService } from 'src/services/ethereum/ethereum.service';
import { XendChainService } from 'src/services/xendchain/xendchain.service';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { ImageService } from '../image/image.service';
import { MoneyWaveService } from '../money-wave/money-wave.service';
import { ProvidusBankService } from '../providus-bank/providus-bank.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(AddressMapping) private amRepo: Repository<AddressMapping>,
        @InjectRepository(Exchange) private exchangeRepo: Repository<Exchange>,
        private moneywaveService: MoneyWaveService,
        private providusService: ProvidusBankService,
        private btcUtils: BitcoinService,
        private ethUtils: EthereumService,
        private xendUtils: XendChainService,
        private emailService: EmailService,
        private imageService: ImageService,
    ) { }

    async findByColumn(col: string, val: string): Promise<User> {
        try {
            let user: User = await this.userRepo.createQueryBuilder("user")
                .where(`${col} = :value`, { value: val })
                .leftJoinAndSelect("user.addressMappings", "addressMappings")
                .getOne();
            return user;
        } catch (error) {
            throw error;
        }
    }

    async getNgncBalance(id: number): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userRepo.findOne(id, { relations: ['addressMappings'] });
                const ethAddress = user.addressMappings.find((x: AddressMapping) => {
                    return x.chain === 'ETH';
                }).chainAddress;
                const ngncBalance: number = await this.xendUtils.getNgncBalance(ethAddress);
                resolve(ngncBalance);
            } catch (error) {
                reject(error);
            }
        });
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

    async balance(id: number, wallet: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let balance = 0;
                let escrow = 0;
                const user: User = await this.userRepo.findOne(id, { relations: ['addressMappings'] });
                switch (wallet) {
                    case 'BTC':
                        const btcAddress = user.addressMappings.find((x: AddressMapping) => {
                            return x.chain === 'BTC';
                        }).chainAddress;
                        balance = await this.btcUtils.getBalance([btcAddress]);
                        escrow = await this.getEscrow('BTC', user.id);
                        balance -= escrow;
                        break;
                    case 'ETH':
                        const ethAddress = user.addressMappings.find((x: AddressMapping) => {
                            return x.chain === 'ETH';
                        }).chainAddress;
                        balance = await this.ethUtils.getBalance(ethAddress);
                        escrow = await this.getEscrow('BTC', user.id);
                        balance -= escrow;
                        break;
                }

                resolve({ balance: balance, escrow: escrow });
            } catch (error) {
                reject(error);
            }
        });
    }

    async confirmEmail(tag: string): Promise<string> {
        const email = AES.decrypt(Buffer.from(tag, 'base64').toString('ascii'), process.env.KEY).toString(enc.Utf8)

        let dbUser = await this.findByColumn("EMAIL", email);

        if (dbUser !== undefined) {
            dbUser.isActivated = true;
            this.userRepo.save(dbUser).then(() => { });
            return "Email confirmation successful. You can now login on the app";
        }

        return "Can not find confirmation link.";
    }

    async login(lro: LoginRequestObject): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const passphraseHash = HmacSHA256(lro.passphrase, process.env.KEY).toString();
                let dbUser = await this.findByColumn("EMAIL", lro.emailAddress);

                if (dbUser === undefined) {
                    throw Error("User with email address already not found");
                }

                if (dbUser.hash !== passphraseHash) {
                    throw Error("Wallet Data Corrupted. Use the recover button to recover your wallet");
                }

                if (!compareSync(lro.password, dbUser.password)) {
                    throw Error("Invalid login details: password");
                }

                if (!dbUser.isActivated) {
                    throw Error("Account is not yet activated. Please check your email for instructions on how to activate your account");
                }

                const ams: AddressMapping[] = [];
                let ngncAddress;
                dbUser.addressMappings.forEach(am => {
                    if (am.chain === 'BTC') {
                        am.fees = this.btcUtils.getFees(am);
                    } else if (am.chain === 'ETH') {
                        ngncAddress = am.chainAddress;
                        am.fees = this.ethUtils.getFees(am);
                    }

                    ams.push(am);
                });

                dbUser.addressMappings = ams;
                dbUser.ngncBalance = await this.xendUtils.getNgncBalance(ngncAddress);
                resolve(dbUser);
            } catch (error) {
                reject(error);
            }
        });
    }

    addNewUser(uro: UserRequestObject): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const salt = genSaltSync(12, 'a');
                const passwordHashed = hashSync(uro.password, salt);
                const passphraseHash = HmacSHA256(uro.passphrase, process.env.KEY).toString();

                let dbUser = await this.findByColumn("EMAIL", uro.emailAddress);
                if (dbUser !== undefined) {
                    // user already exists
                    throw Error("User with email address already exists");
                }

                dbUser = await this.findByColumn("PHONE_NUMBER", uro.phoneNumber);
                if (dbUser !== undefined) {
                    // user already exists
                    throw Error("User with phone number already exists");
                }

                dbUser = await this.findByColumn("bank_account_number", uro.accountNumber);
                if (dbUser !== undefined) {
                    // user already exists
                    throw Error("User with account number already exists");
                }

                dbUser = this.toUser(uro);
                this.ethUtils.getEthereumAddress(uro.passphrase);
                const accountName = await this.moneywaveService.verifyBankAccount(uro.accountNumber, uro.bankCode)
                dbUser.bankAccountName = accountName;
                const bitcoinAM = this.btcUtils.getBitcoinAddress(uro.passphrase);
                bitcoinAM.mnemonicCode = passphraseHash;
                const ethereumAM = this.ethUtils.getEthereumAddress(uro.passphrase);
                ethereumAM.mnemonicCode = passphraseHash;

                dbUser.addressMappings = [];
                dbUser.addressMappings.push(bitcoinAM);
                dbUser.addressMappings.push(ethereumAM);
                dbUser.xendNetworkAddress = ethereumAM.chainAddress;
                dbUser.hash = passphraseHash;
                dbUser.passphrase = passphraseHash;
                dbUser.password = passwordHashed;

                const bvn = dbUser.bankAccountNumber + dbUser.email.length;
                // TODO : Use the real thing in production
                const ngncAccountNumber = "9972122390";//await this.providusService.createBankAccount(bvn, uro.firstName, uro.surName, uro.middleName, dbUser.email);
                dbUser.ngncAccountNumber = ngncAccountNumber;
                dbUser.ngncBank = 'Providus Bank';

                dbUser.idImage = await this.imageService.uploadCustomerIdImage(uro.idImage);
                dbUser = await this.userRepo.save(dbUser);
                bitcoinAM.user = dbUser;
                ethereumAM.user = dbUser;
                await this.amRepo.save(bitcoinAM);
                await this.amRepo.save(ethereumAM);
                const ams: AddressMapping[] = [];
                dbUser.addressMappings.forEach(am => {
                    am.user = null;
                    ams.push(am);
                })

                dbUser.addressMappings = ams;
                this.emailService.sendConfirmationEmail(dbUser).then(() => { });
                resolve(dbUser);
            } catch (error) {
                reject(error);
            }
        });
    }

    toUser(uro: UserRequestObject): User {
        const dr = Math.round(uro.dateRegistered / 1000);
        const u: User = {
            accountType: uro.accountType,
            bankAccountNumber: uro.accountNumber,
            bankCode: uro.bankCode,
            bankName: uro.bankName,
            dateRegistered: dr,
            email: uro.emailAddress,
            enableWhatsapp: uro.enableWhatsapp,
            firstName: uro.firstName,
            middleName: uro.middleName,
            surName: uro.surName,
            fullName: uro.firstName + " " + uro.middleName + " " + uro.surName,
            idImage: uro.idImage,
            idNumber: uro.idNumber,
            idType: uro.idType,
            isActivated: false,
            isApproved: true,
            isBeneficiary: true,
            phoneNumber: uro.phoneNumber,
            walletType: uro.walletType,
            referralCode: uro.referralCode,
        }

        return u;
    }

    getPrivateKey(uro: UserRequestObject) {
        //const am = this.ethUtils.getEthereumAddress("one two three four five six seven eight nine ten eleven twelve");
        //this.logger.debug(am);        
    }

}
