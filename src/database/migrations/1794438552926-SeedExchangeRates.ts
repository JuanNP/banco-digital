import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedExchangeRates1794500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES
        ('USD', 'DOP', 63.500000),
        ('DOP', 'USD', 0.015748),
        ('EUR', 'DOP', 73.200000),
        ('DOP', 'EUR', 0.013661),
        ('EUR', 'USD', 1.152756),
        ('USD', 'EUR', 0.867486)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM exchange_rates`);
  }
}