import {MigrationInterface, QueryRunner} from "typeorm";

export class Exchange1607662441360 implements MigrationInterface {
    name = 'Exchange1607662441360'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_EXCHANGE` (`id` int NOT NULL AUTO_INCREMENT, `amount_to_sell` float NOT NULL, `amount_to_recieve` float NOT NULL, `from_coin` varchar(255) NOT NULL, `to_coin` varchar(255) NOT NULL, `rate` float NOT NULL, `status` varchar(255) NOT NULL, `buyer_from_address` varchar(255) NOT NULL, `buyer_to_address` varchar(255) NOT NULL, `seller_from_address` varchar(255) NOT NULL, `seller_to_address` varchar(255) NOT NULL, `datetime` datetime NOT NULL, `trx_date` datetime NOT NULL, `trx_id` varchar(255) NOT NULL, `trx_hex` varchar(255) NOT NULL, `active` tinyint(1) NOT NULL, `fees` float NOT NULL, `block_fees` float NOT NULL, `xend_fees` float NOT NULL, `sellerId` int NULL, `buyerId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` ADD CONSTRAINT `FK_ba1b72181109ffee610eebf1b1b` FOREIGN KEY (`sellerId`) REFERENCES `XB_USER`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` ADD CONSTRAINT `FK_6df3d6986df5cc3b9debad626a2` FOREIGN KEY (`buyerId`) REFERENCES `XB_USER`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` DROP FOREIGN KEY `FK_6df3d6986df5cc3b9debad626a2`");
        await queryRunner.query("ALTER TABLE `XB_EXCHANGE` DROP FOREIGN KEY `FK_ba1b72181109ffee610eebf1b1b`");
        await queryRunner.query("DROP TABLE `XB_EXCHANGE`");
    }

}
