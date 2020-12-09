import {MigrationInterface, QueryRunner} from "typeorm";

export class UserTableUniqFields1607522029452 implements MigrationInterface {
    name = 'UserTableUniqFields1607522029452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `xb_user_uniq` ON `XB_USER`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `email` `email` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` ADD UNIQUE INDEX `IDX_9b139bb0724751617b78426541` (`email`)");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `phone_number` `phone_number` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` ADD UNIQUE INDEX `IDX_8c1d8d84662a889891c657b1ba` (`phone_number`)");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `bank_account_number` `bank_account_number` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` ADD UNIQUE INDEX `IDX_883f60b728a4a2711292bc1b55` (`bank_account_number`)");
        await queryRunner.query("CREATE UNIQUE INDEX `xb_user_bank_account_numer_uniq` ON `XB_USER` (`bank_account_number`)");
        await queryRunner.query("CREATE UNIQUE INDEX `xb_user_phone_uniq` ON `XB_USER` (`phone_number`)");
        await queryRunner.query("CREATE UNIQUE INDEX `xb_user_email_uniq` ON `XB_USER` (`email`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `xb_user_email_uniq` ON `XB_USER`");
        await queryRunner.query("DROP INDEX `xb_user_phone_uniq` ON `XB_USER`");
        await queryRunner.query("DROP INDEX `xb_user_bank_account_numer_uniq` ON `XB_USER`");
        await queryRunner.query("ALTER TABLE `XB_USER` DROP INDEX `IDX_883f60b728a4a2711292bc1b55`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `bank_account_number` `bank_account_number` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` DROP INDEX `IDX_8c1d8d84662a889891c657b1ba`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `phone_number` `phone_number` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` DROP INDEX `IDX_9b139bb0724751617b78426541`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `email` `email` varchar(255) NOT NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `xb_user_uniq` ON `XB_USER` (`email`, `phone_number`, `bank_account_number`)");
    }

}
