import {MigrationInterface, QueryRunner} from "typeorm";

export class UserGrouplists1607392132587 implements MigrationInterface {
    name = 'UserGrouplists1607392132587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `XB_GL` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `value` varchar(255) NOT NULL, `gl_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `XB_USER` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NOT NULL, `password` varchar(255) NOT NULL, `full_name` varchar(255) NOT NULL, `account_type` varchar(255) NOT NULL, `is_activated` tinyint NOT NULL, `is_beneficiary` tinyint NOT NULL, `enable_whatsapp` tinyint NOT NULL, `is_approved` tinyint NOT NULL, `wallet_type` varchar(255) NOT NULL, `date_registered` int NOT NULL, `xend_network_address` varchar(255) NOT NULL, `hash` varchar(255) NOT NULL, `referral_code` varchar(255) NOT NULL, `agent_id` int NOT NULL, `passphrase` varchar(255) NOT NULL, `phone_number` varchar(255) NOT NULL, `id_image` varchar(255) NOT NULL, `ngnc_account_number` varchar(255) NOT NULL, `ngnc_bank` varchar(255) NOT NULL, `bank_account_name` varchar(255) NOT NULL, `bank_account_number` varchar(255) NOT NULL, `bank_name` varchar(255) NOT NULL, `bank_code` varchar(255) NOT NULL, UNIQUE INDEX `xb_user_uniq` (`email`, `phone_number`, `bank_account_number`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `xb_user_uniq` ON `XB_USER`");
        await queryRunner.query("DROP TABLE `XB_USER`");
        await queryRunner.query("DROP TABLE `XB_GL`");
    }

}
