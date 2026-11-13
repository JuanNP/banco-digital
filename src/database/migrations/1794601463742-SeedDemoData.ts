import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDemoData1794601463742 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO customers (id, first_name, last_name, document_id, email, phone) VALUES
        ('c1000000-0000-4000-8000-000000000001', 'Ana', 'Martínez', '001-0000001-1', 'ana.martinez@example.com', '809-555-0101'),
        ('c1000000-0000-4000-8000-000000000002', 'Carlos', 'Rodríguez', '001-0000002-2', 'carlos.rodriguez@example.com', '829-555-0202'),
        ('c1000000-0000-4000-8000-000000000003', 'María', 'Gómez', '001-0000003-3', 'maria.gomez@example.com', NULL)
    `);

    await queryRunner.query(`
      INSERT INTO accounts (id, account_number, currency, balance, status, customer_id) VALUES
        ('a1000000-0000-4000-8000-000000000001', '1000000001', 'DOP', 50000.00, 'ACTIVE', 'c1000000-0000-4000-8000-000000000001'),
        ('a1000000-0000-4000-8000-000000000002', '1000000002', 'USD', 1200.00, 'ACTIVE', 'c1000000-0000-4000-8000-000000000001'),
        ('a1000000-0000-4000-8000-000000000003', '1000000003', 'DOP', 15000.00, 'ACTIVE', 'c1000000-0000-4000-8000-000000000002'),
        ('a1000000-0000-4000-8000-000000000004', '1000000004', 'EUR', 800.00, 'ACTIVE', 'c1000000-0000-4000-8000-000000000002'),
        ('a1000000-0000-4000-8000-000000000005', '1000000005', 'USD', 300.00, 'ACTIVE', 'c1000000-0000-4000-8000-000000000003'),
        ('a1000000-0000-4000-8000-000000000006', '1000000006', 'DOP', 2500.00, 'FROZEN', 'c1000000-0000-4000-8000-000000000003')
    `);

    await queryRunner.query(`
      INSERT INTO transactions (type, amount, currency, destination_account_id, description)
      SELECT 'DEPOSIT', balance, currency::text::transactions_currency_enum, id, 'Seed opening deposit'
      FROM accounts
      WHERE id::text LIKE 'a1000000-%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM transactions WHERE description = 'Seed opening deposit'`,
    );
    await queryRunner.query(
      `DELETE FROM accounts WHERE id::text LIKE 'a1000000-%'`,
    );
    await queryRunner.query(
      `DELETE FROM customers WHERE id::text LIKE 'c1000000-%'`,
    );
  }
}
