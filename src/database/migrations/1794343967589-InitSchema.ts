import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1794343967589 implements MigrationInterface {
  name = 'InitSchema1794343967589';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "document_id" character varying(30) NOT NULL, "email" character varying(150) NOT NULL, "phone" character varying(30), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f5a089404309934e111285a08f0" UNIQUE ("document_id"), CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'FROZEN', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_number" character varying(20) NOT NULL, "currency" "public"."accounts_currency_enum" NOT NULL, "balance" numeric(18,2) NOT NULL DEFAULT '0', "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE', "customer_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ffd1ae96513bfb2c6eada0f7d31" UNIQUE ("account_number"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b74e55f12afe9234f76a42dc3" ON "accounts"  ("customer_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exchange_rates_base_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exchange_rates_target_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exchange_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "base_currency" "public"."exchange_rates_base_currency_enum" NOT NULL, "target_currency" "public"."exchange_rates_target_currency_enum" NOT NULL, "rate" numeric(18,6) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6b60c525943ed242d78debcbf7b" UNIQUE ("base_currency", "target_currency"), CONSTRAINT "PK_33a614bad9e61956079d817ebe2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transactions_type_enum" NOT NULL, "amount" numeric(18,2) NOT NULL, "currency" "public"."transactions_currency_enum" NOT NULL, "source_account_id" uuid, "destination_account_id" uuid, "converted_amount" numeric(18,2), "exchange_rate" numeric(18,6), "description" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a008a672b1acca7f679de9f2a2" ON "transactions"  ("source_account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98c19d7f096b4ab011d3547eb0" ON "transactions"  ("destination_account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_450a5294dfde65588ff285fcff" ON "transactions"  ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_8b74e55f12afe9234f76a42dc30" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a008a672b1acca7f679de9f2a2a" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_98c19d7f096b4ab011d3547eb0d" FOREIGN KEY ("destination_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_98c19d7f096b4ab011d3547eb0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a008a672b1acca7f679de9f2a2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_8b74e55f12afe9234f76a42dc30"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_450a5294dfde65588ff285fcff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98c19d7f096b4ab011d3547eb0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a008a672b1acca7f679de9f2a2"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_currency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(`DROP TABLE "exchange_rates"`);
    await queryRunner.query(
      `DROP TYPE "public"."exchange_rates_target_currency_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."exchange_rates_base_currency_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b74e55f12afe9234f76a42dc3"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_currency_enum"`);
    await queryRunner.query(`DROP TABLE "customers"`);
  }
}
