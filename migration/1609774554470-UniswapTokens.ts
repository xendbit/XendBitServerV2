import {MigrationInterface, QueryRunner} from "typeorm";

export class UniswapTokens1609774554470 implements MigrationInterface {
    name = 'UniswapTokens1609774554470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_UNISWAP_TOKEN` (`id` int NOT NULL AUTO_INCREMENT, `chain_id` int NOT NULL, `address` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `symbol` varchar(255) NOT NULL, `decimals` int NOT NULL, `logo_uri` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609774555296'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` CHANGE `fetch_coin_date` `fetch_coin_date` bigint NOT NULL DEFAULT '1609774309767'");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("DROP TABLE `XB_UNISWAP_TOKEN`");
    }

}
