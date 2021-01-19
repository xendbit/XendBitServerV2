import {MigrationInterface, QueryRunner} from "typeorm";

export class UserBVN1610711242596 implements MigrationInterface {
    name = 'UserBVN1610711242596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` DROP FOREIGN KEY `FK_ce8940bb5ca7cb7fd34632f8032`");
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` DROP COLUMN `userTokenId`");
        await queryRunner.query("ALTER TABLE `XB_USER` ADD `bvn` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` DROP COLUMN `bvn`");
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` ADD `userTokenId` int NULL");
        await queryRunner.query("ALTER TABLE `XB_UNISWAP_TOKEN` ADD CONSTRAINT `FK_ce8940bb5ca7cb7fd34632f8032` FOREIGN KEY (`userTokenId`) REFERENCES `XB_USER_TOKENS`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

}
