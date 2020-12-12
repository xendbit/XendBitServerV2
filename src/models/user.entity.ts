import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { AddressMapping } from "./address.mapping.entity";

@Entity({ name: "XB_USER" })
@Unique("xb_user_email_uniq", ["email"])
@Unique("xb_user_phone_uniq", ["phoneNumber"])
@Unique("xb_user_bank_account_numer_uniq", ["bankAccountNumber"])
export class User {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column()
    email: string;
    @Column()
    password?: string;
    @Column({name: "fullname"})
    fullName: string;
    @Column({name: "firstname"})
    firstName: string;
    @Column({name: "middlename"})
    middleName: string;
    @Column({name: "surname"})
    surName: string;
    @Column({name: "account_type"})
    accountType: string;
    @Column({name: "is_activated", type: 'tinyint', width: 1})
    isActivated: boolean;
    @Column({name: "is_beneficiary", type: 'tinyint', width: 1})
    isBeneficiary: boolean;
    @Column({name: "enable_whatsapp", type: 'tinyint', width: 1})
    enableWhatsapp: boolean;
    @Column({name: "is_approved", type: 'tinyint', width: 1})
    isApproved: boolean;
    @Column({name: "wallet_type"})
    walletType: string;
    @Column({name: "date_registered"})
    dateRegistered: number;
    @Column({name: "xend_network_address"})
    xendNetworkAddress?: string;
    @Column()
    hash?: string;
    @Column({name: "referral_code"})
    referralCode?: string;
    @Column()
    passphrase?: string;
    @Column({name: "phone_number"})
    phoneNumber: string;
    @Column({name: "id_image", width: 5000})    
    idImage: string;
    @Column({name: "id_type"})    
    idType: string;
    @Column({name: "id_number"})    
    idNumber: string;            
    @Column({name: "ngnc_account_number"})
    ngncAccountNumber?: string;
    @Column({name: "ngnc_bank"})
    ngncBank?: string;
    @Column({name: "bank_account_name"})
    bankAccountName?: string;
    @Column({name: "bank_account_number"})
    bankAccountNumber: string;
    @Column({name: "bank_name"})
    bankName: string;    
    @Column({name: "bank_code"})
    bankCode: string;    
    @OneToMany(type => AddressMapping, addressMapping => addressMapping.user)    
    @JoinColumn()
    addressMappings?: AddressMapping[]
    ngncBalance?: number;
}
