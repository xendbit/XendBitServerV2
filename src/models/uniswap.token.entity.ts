import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'XB_UNISWAP_TOKEN'})
export class UniswapToken {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({name: 'chain_id'})
    chainId: number;
    @Column()
    address: string;
    @Column()
    name: string;
    @Column()
    symbol: string;
    @Column()
    decimals: number;
    @Column({name: 'logo_uri'})
    logoURI: string;
}