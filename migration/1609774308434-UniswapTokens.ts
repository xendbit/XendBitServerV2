import {MigrationInterface, QueryRunner} from "typeorm";

export class UniswapTokens1609774308434 implements MigrationInterface {
    name = 'UniswapTokens1609774308434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609774309767'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609367346621'");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
    }

}
