import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UniswapToken } from "./uniswap.token.entity";

@Entity({ name: "XB_USER_TOKEN" })
export class UserToken {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column({name: 'user_id'})
    userId: number;
    @Column()
    address: string;
    @Column()
    name: string;
    @Column()
    symbol: string;
    @Column()
    decimals: number;
    @Column({ name: 'logo_uri' })
    logoURI: string;    
}