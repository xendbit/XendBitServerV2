import {MigrationInterface, QueryRunner} from "typeorm";

export class BinanceOrderField1609283855723 implements MigrationInterface {
    name = 'BinanceOrderField1609283855723'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `side` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `timestamp` int NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `coin` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `status` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609283856567'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609283289243'");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `status`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `coin`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `timestamp`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `side`");
    }

}
