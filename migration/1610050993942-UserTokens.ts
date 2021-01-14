import {MigrationInterface, QueryRunner} from "typeorm";

export class UserTokens1610050993942 implements MigrationInterface {
    name = 'UserTokens1610050993942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_USER_TOKENS` (`id` int NOT NULL AUTO_INCREMENT, `user_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` ADD `userTokenId` int NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` ADD CONSTRAINT `FK_ce8940bb5ca7cb7fd34632f8032` FOREIGN KEY (`userTokenId`) REFERENCES `XB_USER_TOKENS`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` DROP FOREIGN KEY `FK_ce8940bb5ca7cb7fd34632f8032`");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609774555296'");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` DROP COLUMN `userTokenId`");
        await queryRunner.query("DROP TABLE `XB_USER_TOKENS`");
    }

}
