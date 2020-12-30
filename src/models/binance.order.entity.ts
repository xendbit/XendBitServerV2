import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SIDE, STATUS } from '../utils/enums';
import { User } from "./user.entity";

@Entity({name: 'XB_BINANCE_ORDER'})
export class BinanceOrder {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({name: 'client_id'})
    clientId: string;

    @Column()
    side: SIDE;

    @Column({type: 'float'})
    quantity: number;

    @Column({type: 'bigint'})
    timestamp: number;

    @Column({name: 'quote_order_quantity', type: 'float'})
    quoteOrderQty: number;     

    @Column({type: 'float'})
    price: number;

    @ManyToOne(type => User)
    user: User

    @Column()
    coin: string;

    @Column()
    status: STATUS;

    @Column({name: 'fetched_coin', width: 1, type: 'tinyint', default: 0})
    fetchedCoin?: boolean;
    
    @Column({name: 'fetch_coin_date', type: 'bigint', default: new Date().getTime() })
    fetchCoinDate?: number;
}