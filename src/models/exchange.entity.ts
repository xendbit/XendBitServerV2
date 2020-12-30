import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "XB_EXCHANGE" })
export class Exchange {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: "amount_to_sell", type: "float" })
    amountToSell: number;

    @Column({ name: "amount_to_recieve", type: "float" })
    amountToRecieve: number;

    @Column({ name: "from_coin" })
    fromCoin: string;

    @Column({ name: "to_coin" })
    toCoin: string;

    @Column({ type: "float" })
    rate: number;

    @ManyToOne(type => User, {nullable: true})
    seller: User;

    @ManyToOne(type => User, {nullable: true})
    buyer: User;

    @Column()
    status: string;

    @Column({ name: "buyer_from_address" })
    buyerFromAddress: string;

    @Column({ name: "buyer_to_address" })
    buyerToAddress: string;

    @Column({ name: "seller_from_address" })
    sellerFromAddress: string;

    @Column({ name: "seller_to_address" })
    sellerToAddress: string;

    @Column({ type: "bigint" })
    datetime: number;

    @Column({ name: "trx_id" })
    trxId: string;

    @Column({ name: "trx_hex" })
    trxHex: string;

    @Column({ type: 'tinyint', width: 1 })
    active: boolean;

    @Column({ type: "float" })
    fees: number;

    @Column({ name: "block_fees", type: "float" })
    blockFees: number;

    @Column({ name: "xend_fees", type: "float" })
    xendFees: number;
}