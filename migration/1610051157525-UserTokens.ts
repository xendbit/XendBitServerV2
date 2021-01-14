import {MigrationInterface, QueryRunner} from "typeorm";

export class UserTokens1610051157525 implements MigrationInterface {
    name = 'UserTokens1610051157525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_USER_TOKEN` (`id` int NOT NULL AUTO_INCREMENT, `user_id` int NOT NULL, `address` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `symbol` varchar(255) NOT NULL, `decimals` int NOT NULL, `logo_uri` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609774555296'");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("DROP TABLE `XB_USER_TOKEN`");
    }

}
