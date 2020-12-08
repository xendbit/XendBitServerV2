import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity({ name: "XB_USER" })
@Unique("xb_user_uniq", ["email", "phone_number", "bank_account_number"])
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    email: string;
    @Column()
    password: string;
    @Column()
    full_name: string;
    @Column()
    account_type: string;
    @Column()
    is_activated: boolean;
    @Column()
    is_beneficiary: boolean;
    @Column()
    enable_whatsapp: boolean;
    @Column()
    is_approved: boolean;
    @Column()
    wallet_type: string;
    @Column()
    date_registered: number;
    @Column()
    xend_network_address: string;
    @Column()
    hash: string;
    @Column()
    referral_code: string;
    @Column()
    agent_id: number;
    @Column()
    passphrase: string;
    @Column()
    phone_number: string;
    @Column()
    id_image: string;
    @Column()
    ngnc_account_number: string;
    @Column()
    ngnc_bank: string;
    @Column()
    bank_account_name: string;
    @Column()
    bank_account_number: string;
    @Column()
    bank_name: string;    
    @Column()
    bank_code: string;    
}
