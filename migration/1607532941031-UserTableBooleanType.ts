import {MigrationInterface, QueryRunner} from "typeorm";

export class UserTableBooleanType1607532941031 implements MigrationInterface {
    name = 'UserTableBooleanType1607532941031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_883f60b728a4a2711292bc1b55` ON `XB_USER`");
        await queryRunner.query("DROP INDEX `IDX_8c1d8d84662a889891c657b1ba` ON `XB_USER`");
        await queryRunner.query("DROP INDEX `IDX_9b139bb0724751617b78426541` ON `XB_USER`");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `is_activated` `is_activated` tinyint(1) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `is_beneficiary` `is_beneficiary` tinyint(1) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `enable_whatsapp` `enable_whatsapp` tinyint(1) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `is_approved` `is_approved` tinyint(1) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `is_approved` `is_approved` tinyint(4) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `enable_whatsapp` `enable_whatsapp` tinyint(4) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `is_beneficiary` `is_beneficiary` tinyint(4) NOT NULL");
        await queryRunner.query("ALTER TABLE `XB_USER` CHANGE `is_activated` `is_activated` tinyint(4) NOT NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_9b139bb0724751617b78426541` ON `XB_USER` (`email`)");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_8c1d8d84662a889891c657b1ba` ON `XB_USER` (`phone_number`)");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_883f60b728a4a2711292bc1b55` ON `XB_USER` (`bank_account_number`)");
    }

}
