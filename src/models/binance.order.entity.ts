import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SIDE, STATUS } from '../utils/enums';
import { User } from "./user.entity";

@Entity({name: 'XB_BINANCE_ORDER'})
export class BinanceOrder {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column({name: 'client_id'})
    clientId: string;
    side: SIDE;
    @Column({type: 'float'})
    quantity: number;
    timestamp: number;
    @Column({name: 'quote_order_quantity', type: 'float'})
    quoteOrderQty: number;     
    @Column({type: 'float'})
    price: number;
    @ManyToOne(type => User)
    user: User
    coin: string;
    status: STATUS;
    @Column({name: 'fetched_coin', width: 1, type: 'tinyint'})
    fetchedCoin?: boolean;
    @Column({ type: "datetime" })
    fetchCoinDate?: Date;
}