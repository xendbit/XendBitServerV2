import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { AES, enc, HmacSHA256 } from 'crypto-js';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { LoginRequestObject } from 'src/models/request.objects/login.ro';
import { UserRequestObject } from 'src/models/request.objects/new.user.ro';
import { User } from 'src/models/user.entity';
import { BitcoinUtils } from 'src/utils/bitcoin.utils';
import { EthereumUtils } from 'src/utils/ethereum.utils';
import { XendChainUtils } from 'src/utils/xendchain.utils';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { MoneyWaveService } from '../money-wave/money-wave.service';
import { ProvidusBankService } from '../providus-bank/providus-bank.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(AddressMapping) private amRepo: Repository<AddressMapping>,
        private moneywaveService: MoneyWaveService,
        private providusService: ProvidusBankService,
        private btcUtils: BitcoinUtils,
        private ethUtils: EthereumUtils,
        private xendUtils: XendChainUtils,
        private emailService: EmailService,        
    ) { }

    async findByColumn(col: string, val: string): Promise<User> {
        try {
            const query = "SELECT * FROM XB_USER WHERE " + col + " = ?";
            const dbUsersList = await this.userRepo.query(query, [val]);
            if (dbUsersList.length === 1) {
                return dbUsersList[0];
            } if (dbUsersList.length > 1) {
                throw Error(`ResultSet returned more than one (1) rows: [${dbUsersList.length}]`)
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    async confirmEmail(tag: string): Promise<string> {
        const email = AES.decrypt(Buffer.from(tag, 'base64').toString('ascii'), process.env.KEY).toString(enc.Utf8)
        console.log(email);
        this.logger.debug(email);
        
        let dbUser = await this.findByColumn("EMAIL", email);

        if(dbUser !== null) {
            dbUser = await this.userRepo.findOne(dbUser.id, { relations: ["addressMappings"] });                
            dbUser.isActivated = true;
            this.userRepo.save(dbUser).then(() => {});
            return "Email confirmation successful. You can now login on the app";
        }

        return "Can not find confirmation link.";
    }

    async login(lro: LoginRequestObject): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const passphraseHash = HmacSHA256(lro.passphrase, process.env.KEY).toString();
                let dbUser = await this.findByColumn("EMAIL", lro.emailAddress);

                if(dbUser !== null) {
                    dbUser = await this.userRepo.findOne(dbUser.id, { relations: ["addressMappings"] });                
                }
                               
                if (dbUser === null) {
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
                if (dbUser !== null) {
                    // user already exists
                    const error = Error("User with email address already exists");
                    throw error;
                }

                dbUser = await this.findByColumn("PHONE_NUMBER", uro.phoneNumber);
                if (dbUser !== null) {
                    // user already exists
                    const error = Error("User with phone number already exists");
                    throw error;
                }

                dbUser = await this.findByColumn("bank_account_number", uro.accountNumber);
                if (dbUser !== null) {
                    // user already exists
                    const error = Error("User with account number already exists");
                    throw error;
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
                this.emailService.sendConfirmationEmail(dbUser).then(() => {});
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
