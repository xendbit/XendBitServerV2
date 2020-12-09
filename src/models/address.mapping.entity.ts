import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({name: "XB_ADDRESS_MAPPING"})
export class AddressMapping {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column()
    chain: string;
    @Column({name: "mnemonic_code"})
    mnemonicCode: string;
    @Column({name: "chain_address"})
    chainAddress: string;
    @Column()
    wif: string;
    @ManyToOne(type => User, user => user.addressMappings)    
    user?: User;
    @Column({name: "min_xend_fees", type: "float"})
    minXendFees?;
    @Column({name: "min_block_fees", type: "float"})
    minBlockFees?;
    @Column({name: "external_deposit_fees", type: "float"})
    externalDepositFees?;
    @Column({name: "perc_external_trading_fees", type: "float"})
    percExternalTradingFees?;
    @Column({name: "external_withdrawal_fees", type: "float"})
    externalWithdrawalFees?;
    @Column({name: "max_xend_fees", type: "float"})
    maxXendFees?;
    @Column({name: "perc_xend_fees", type: "float"})
    percXendFees?;
}