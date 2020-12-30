import {MigrationInterface, QueryRunner} from "typeorm";

export class ExchangeFields1609367345606 implements MigrationInterface {
    name = 'ExchangeFields1609367345606'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` DROP COLUMN `trx_date`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609367346621'");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` DROP COLUMN `datetime`");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` ADD `datetime` bigint NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` DROP COLUMN `datetime`");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` ADD `datetime` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609283968587'");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` ADD `trx_date` datetime NOT NULL");
    }

}
