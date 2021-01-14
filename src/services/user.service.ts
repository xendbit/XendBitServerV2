import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { AES, enc, HmacSHA256 } from 'crypto-js';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { LoginRequestObject } from 'src/models/request.objects/login.ro';
import { UserRequestObject } from 'src/models/request.objects/new.user.ro';
import { User } from 'src/models/user.entity';
import { BitcoinService } from 'src/services/bitcoin.service';
import { Repository } from 'typeorm';
import { BlockchainService, History } from './blockchain.service';
import { EmailService } from './email.service';
import { EthereumService } from './ethereum.service';
import { ImageService } from './image.service';
import { MoneyWaveService } from './money-wave.service';
import { ProvidusBankService } from './providus-bank.service';
import { XendChainService } from './xendchain.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    @InjectRepository(User) private userRepo: Repository<User>;
    @InjectRepository(AddressMapping) private amRepo: Repository<AddressMapping>;
    constructor(
        private moneywaveService: MoneyWaveService,
        private providusService: ProvidusBankService,
        private btcUtils: BitcoinService,
        private ethUtils: EthereumService,
        private xendService: XendChainService,
        private emailService: EmailService,
        private imageService: ImageService,
        private blockchainService: BlockchainService,
    ) {
    }

    async history(address: string, wallet: string): Promise<History[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.findByColumn("xend_network_address", address);
                resolve(this.blockchainService.history(user.id, address, wallet));
            } catch (error) {
                reject(error);
            }
        });
    }

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
                const ngncBalance: number = await this.xendService.getNgncBalance(ethAddress);
                resolve(ngncBalance);
            } catch (error) {
                reject(error);
            }
        });
    }

    async balance(id: number, wallet: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const user: User = await this.userRepo.findOne(id, { relations: ['addressMappings'] });
                user.addressMappings = await this.blockchainService.getFees(user);
                resolve(await this.blockchainService.getBalance(wallet, user));
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

    async fundAccount(accountNumber: string, amount: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let dbUser = await this.findByColumn("NGNC_ACCOUNT_NUMBER", accountNumber);
                if (dbUser === undefined) {
                    reject("User with account number not found");
                }

                const am: AddressMapping = dbUser.addressMappings.find((x: AddressMapping) => {
                    return x.chain === 'ETH';
                });

                amount = Math.round(amount);
                this.logger.debug(`Funding ....... ${am.chainAddress} with ${amount}`);
                await this.xendService.fundNgnc(am.chainAddress, amount);
                resolve("success");
            } catch (error) {
                reject(error);
            }
        });
    }

    loginNoHash(emailAddress: string, password: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                let dbUser = await this.findByColumn("EMAIL", emailAddress);

                if (dbUser === undefined) {
                    reject("User with email address already not found");
                }

                if (!compareSync(password, dbUser.password)) {
                    reject("Invalid login details: password");
                }

                if (!dbUser.isActivated) {
                    reject("Account is not yet activated. Please check your email for instructions on how to activate your account");
                }

                const ams: AddressMapping[] = [];

                dbUser.addressMappings = await this.blockchainService.getFees(dbUser);
                resolve(dbUser);
            } catch (error) {
                reject(error);
            }
        });
    }

    login(lro: LoginRequestObject): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const passphraseHash = HmacSHA256(lro.passphrase, process.env.KEY).toString();
                let dbUser = await this.findByColumn("EMAIL", lro.emailAddress);

                if (dbUser === undefined) {
                    reject("User with email address already not found");
                }

                if (dbUser.hash !== passphraseHash) {
                    // dbUser.hash = passphraseHash;
                    // this.userRepo.save(dbUser); 
                    reject("Wallet Data Corrupted. Use the recover button to recover your wallet");
                }

                if (!compareSync(lro.password, dbUser.password)) {
                    reject("Invalid login details: password");
                }

                if (!dbUser.isActivated) {
                    reject("Account is not yet activated. Please check your email for instructions on how to activate your account");
                }

                const ams: AddressMapping[] = [];                

                dbUser.addressMappings = await this.blockchainService.getFees(dbUser);
                const ethAddress = dbUser.addressMappings.find((x: AddressMapping) => {
                    return x.chain === 'ETH';
                }).chainAddress;
                
                dbUser.ngncBalance = await this.xendService.getNgncBalance(ethAddress);
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
                    reject("User with email address already exists");
                }

                dbUser = await this.findByColumn("PHONE_NUMBER", uro.phoneNumber);
                if (dbUser !== undefined) {
                    // user already exists
                    reject("User with phone number already exists");
                }

                dbUser = await this.findByColumn("bank_account_number", uro.accountNumber);
                if (dbUser !== undefined) {
                    // user already exists
                    reject("User with account number already exists");
                }

                dbUser = this.toUser(uro);
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

}
