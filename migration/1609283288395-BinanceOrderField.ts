import {MigrationInterface, QueryRunner} from "typeorm";

export class BinanceOrderField1609283288395 implements MigrationInterface {
    name = 'BinanceOrderField1609283288395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `fetch_coin_date`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `fetch_coin_date` bigint NOT NULL DEFAULT '1609283289243'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP COLUMN `fetch_coin_date`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD `fetch_coin_date` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
    }

}
