import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "XB_WITHDRAW" })
export class Withdraw {
    @PrimaryGeneratedColumn()
    id?: number;    
    @Column()
    userId: number;
    @Column()
    withdrawalId: string;
    @Column()
    amount: number;
    @Column()
    bankAccountName: string;
    @Column()
    bankAccountNumber: string;
    @Column()
    bankName: string;
    @Column()
    bankCode: string;
    @Column({name: 'processed', width: 1, type: 'tinyint', default: 0})
    processed: boolean;
    @Column({type: 'bigint', width: 20})
    processedDate: number;
}