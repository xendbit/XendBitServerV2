import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { genSaltSync, hashSync } from 'bcrypt';
import { HmacSHA256 } from 'crypto-js';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { UserRequestObject } from 'src/models/request.objects/new.user.ro';
import { User } from 'src/models/user.entity';
import { BitcoinUtils } from 'src/utils/bitcoin.utils';
import { EthereumUtils } from 'src/utils/ethereum.utils';
import { Repository } from 'typeorm';
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
    ) { }

    async findByColumn(col: string, val: string): Promise<User> {
        try {
            const query = "SELECT * FROM XB_USER WHERE " + col + " = ?";
            const dbUsersList = await this.userRepo.query(query, [val]);
            if (dbUsersList.length === 1) {
                return dbUsersList[0];
            } if(dbUsersList.length > 1) {
                throw Error(`ResultSet returned more than one (1) rows: [${dbUsersList.length}]`)
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    async addNewUser(uro: UserRequestObject): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const salt = genSaltSync(12, 'b');
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
                resolve(dbUser);
            } catch (error) {
                reject(error);
            }
        });
    }

    toUser(uro: UserRequestObject): User {
        const dr = Math.round(uro.dateRegistered/1000);
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
