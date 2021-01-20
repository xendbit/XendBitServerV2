import {MigrationInterface, QueryRunner} from "typeorm";

export class WithdrawalRequest1611172616287 implements MigrationInterface {
    name = 'WithdrawalRequest1611172616287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_WITHDRAW` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `withdrawalId` varchar(255) NOT NULL, `amount` int NOT NULL, `bankAccountName` varchar(255) NOT NULL, `bankAccountNumber` varchar(255) NOT NULL, `bankName` varchar(255) NOT NULL, `bankCode` varchar(255) NOT NULL, `processed` tinyint(1) NOT NULL DEFAULT '0', `processedDate` bigint(20) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_USER` DROP COLUMN `date_registered`");
        await queryRunner.query("ALTER TABLE `XB_USER` ADD `date_registered` int NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` CHANGE `chain` `chain` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `id_image` `id_image` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` DROP COLUMN `date_registered`");
        await queryRunner.query("ALTER TABLE `XB_USER` ADD `date_registered` bigint NOT NULL");
        await queryRunner.query("DROP TABLE `XB_WITHDRAW`");
    }

}
