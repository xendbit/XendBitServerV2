import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1607483312924 implements MigrationInterface {
    name = 'Init1607483312924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_USER` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NOT NULL, `password` varchar(255) NOT NULL, `fullname` varchar(255) NOT NULL, `firstname` varchar(255) NOT NULL, `middlename` varchar(255) NOT NULL, `surname` varchar(255) NOT NULL, `account_type` varchar(255) NOT NULL, `is_activated` tinyint NOT NULL, `is_beneficiary` tinyint NOT NULL, `enable_whatsapp` tinyint NOT NULL, `is_approved` tinyint NOT NULL, `wallet_type` varchar(255) NOT NULL, `date_registered` int NOT NULL, `xend_network_address` varchar(255) NOT NULL, `hash` varchar(255) NOT NULL, `referral_code` varchar(255) NOT NULL, `passphrase` varchar(255) NOT NULL, `phone_number` varchar(255) NOT NULL, `id_image` varchar(255) NOT NULL, `id_type` varchar(255) NOT NULL, `id_number` varchar(255) NOT NULL, `ngnc_account_number` varchar(255) NOT NULL, `ngnc_bank` varchar(255) NOT NULL, `bank_account_name` varchar(255) NOT NULL, `bank_account_number` varchar(255) NOT NULL, `bank_name` varchar(255) NOT NULL, `bank_code` varchar(255) NOT NULL, UNIQUE INDEX `xb_user_uniq` (`email`, `phone_number`, `bank_account_number`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `XB_ADDRESS_MAPPING` (`id` int NOT NULL AUTO_INCREMENT, `chain` varchar(255) NOT NULL, `mnemonic_code` varchar(255) NOT NULL, `chain_address` varchar(255) NOT NULL, `wif` varchar(255) NOT NULL, `min_xend_fees` float NOT NULL, `min_block_fees` float NOT NULL, `external_deposit_fees` float NOT NULL, `perc_external_trading_fees` float NOT NULL, `external_withdrawal_fees` float NOT NULL, `max_xend_fees` float NOT NULL, `perc_xend_fees` float NOT NULL, `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `XB_GL` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `value` varchar(255) NOT NULL, `gl_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` ADD CONSTRAINT `FK_b65baa25d71862be270f71813f2` FOREIGN KEY (`userId`) REFERENCES `XB_USER`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_ADDRESS_MAPPING` DROP FOREIGN KEY `FK_b65baa25d71862be270f71813f2`");
        await queryRunner.query("DROP TABLE `XB_GL`");
        await queryRunner.query("DROP TABLE `XB_ADDRESS_MAPPING`");
        await queryRunner.query("DROP INDEX `xb_user_uniq` ON `XB_USER`");
        await queryRunner.query("DROP TABLE `XB_USER`");
    }

}
