import {MigrationInterface, QueryRunner} from "typeorm";

export class BinanceOrder1607816853807 implements MigrationInterface {
    name = 'BinanceOrder1607816853807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_BINANCE_ORDER` (`id` int NOT NULL AUTO_INCREMENT, `client_id` varchar(255) NOT NULL, `quantity` float NOT NULL, `quote_order_quantity` float NOT NULL, `price` float NOT NULL, `fetched_coin` tinyint(1) NOT NULL, `fetchCoinDate` datetime NOT NULL, `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` ADD CONSTRAINT `FK_8e589ea997918b9cb3a91ee237d` FOREIGN KEY (`userId`) REFERENCES `XB_USER`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_BINANCE_ORDER` DROP FOREIGN KEY `FK_8e589ea997918b9cb3a91ee237d`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("DROP TABLE `XB_BINANCE_ORDER`");
    }

}
