import {MigrationInterface, QueryRunner} from "typeorm";

export class BinanceOrderField1609283967663 implements MigrationInterface {
    name = 'BinanceOrderField1609283967663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `timestamp`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `timestamp` bigint NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609283968587'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609283856567'");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `timestamp`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `timestamp` int NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
    }

}
