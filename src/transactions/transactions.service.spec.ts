import { BadRequestException } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import type { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountsService } from '../accounts/accounts.service.js';
import { Account } from '../accounts/entities/account.entity.js';
import { AccountStatus } from '../common/enums/account-status.enum.js';
import { Currency } from '../common/enums/currency.enum.js';
import { TransactionType } from '../common/enums/transaction-type.enum.js';
import type { ExchangeRatesService } from '../exchange-rates/exchange-rates.service.js';
import { TransactionsService } from './transactions.service.js';

function buildAccount(data: Partial<Account>): Account {
  return Object.assign(new Account(), {
    currency: Currency.DOP,
    balance: '0.00',
    status: AccountStatus.ACTIVE,
    ...data,
  });
}

describe('TransactionsService', () => {
  let accounts: Map<string, Account>;
  let manager: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let getRate: ReturnType<typeof vi.fn>;
  let service: TransactionsService;

  const dop = () => accounts.get('1111111111')!;
  const usd = () => accounts.get('2222222222')!;

  beforeEach(() => {
    accounts = new Map([
      [
        '1111111111',
        buildAccount({
          id: 'dop-id',
          accountNumber: '1111111111',
          balance: '10000.00',
        }),
      ],
      [
        '2222222222',
        buildAccount({
          id: 'usd-id',
          accountNumber: '2222222222',
          currency: Currency.USD,
        }),
      ],
    ]);

    manager = {
      findOne: vi.fn(
        async (_entity, { where }) => accounts.get(where.accountNumber) ?? null,
      ),
      save: vi.fn(async (entity) => entity),
      create: vi.fn((_entity, data) => ({ ...data })),
    };
    getRate = vi.fn(async () => new Decimal(1));

    const dataSource = { transaction: vi.fn((work) => work(manager)) };

    service = new TransactionsService(
      {} as never,
      dataSource as unknown as DataSource,
      {} as AccountsService,
      { getRate } as unknown as ExchangeRatesService,
    );
  });

  describe('deposit', () => {
    it('adds the amount to the balance and records a deposit', async () => {
      const transaction = await service.deposit({
        accountNumber: '1111111111',
        amount: '250.50',
      });

      expect(dop().balance).toBe('10250.50');
      expect(transaction).toMatchObject({
        type: TransactionType.DEPOSIT,
        amount: '250.50',
        currency: Currency.DOP,
        destinationAccountId: 'dop-id',
      });
    });

    it('rejects a zero amount', async () => {
      await expect(
        service.deposit({ accountNumber: '1111111111', amount: '0' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects deposits into a frozen account', async () => {
      dop().status = AccountStatus.FROZEN;

      await expect(
        service.deposit({ accountNumber: '1111111111', amount: '10' }),
      ).rejects.toMatchObject({
        response: { code: 'ACCOUNT_NOT_ACTIVE' },
      });
    });
  });

  describe('withdraw', () => {
    it('fails with INSUFFICIENT_FUNDS and leaves the balance untouched', async () => {
      await expect(
        service.withdraw({ accountNumber: '1111111111', amount: '10000.01' }),
      ).rejects.toMatchObject({
        response: { code: 'INSUFFICIENT_FUNDS' },
      });

      expect(dop().balance).toBe('10000.00');
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('allows withdrawing the whole balance', async () => {
      await service.withdraw({ accountNumber: '1111111111', amount: '10000' });

      expect(dop().balance).toBe('0.00');
    });
  });

  describe('transfer', () => {
    it('converts the amount using the exchange rate', async () => {
      getRate.mockResolvedValue(new Decimal('0.015748'));

      const transaction = await service.transfer({
        sourceAccountNumber: '1111111111',
        destinationAccountNumber: '2222222222',
        amount: '6350.00',
      });

      expect(getRate).toHaveBeenCalledWith(Currency.DOP, Currency.USD);
      expect(dop().balance).toBe('3650.00');
      expect(usd().balance).toBe('100.00');
      expect(transaction).toMatchObject({
        type: TransactionType.TRANSFER,
        amount: '6350.00',
        convertedAmount: '100.00',
        exchangeRate: '0.015748',
        sourceAccountId: 'dop-id',
        destinationAccountId: 'usd-id',
      });
    });

    it('does not store conversion data when both accounts share the currency', async () => {
      accounts.set(
        '3333333333',
        buildAccount({ id: 'dop2-id', accountNumber: '3333333333' }),
      );

      const transaction = await service.transfer({
        sourceAccountNumber: '1111111111',
        destinationAccountNumber: '3333333333',
        amount: '100',
      });

      expect(transaction.convertedAmount).toBeNull();
      expect(transaction.exchangeRate).toBeNull();
    });

    it('locks accounts in a fixed order regardless of direction', async () => {
      await service
        .transfer({
          sourceAccountNumber: '2222222222',
          destinationAccountNumber: '1111111111',
          amount: '0.01',
        })
        .catch(() => undefined);

      const lockedOrder = manager.findOne.mock.calls.map(
        ([, options]) => options.where.accountNumber,
      );
      expect(lockedOrder).toEqual(['1111111111', '2222222222']);
    });

    it('rejects transfers to the same account', async () => {
      await expect(
        service.transfer({
          sourceAccountNumber: '1111111111',
          destinationAccountNumber: '1111111111',
          amount: '1',
        }),
      ).rejects.toMatchObject({ response: { code: 'SAME_ACCOUNT' } });
    });

    it('fails with NOT_FOUND when the destination does not exist', async () => {
      await expect(
        service.transfer({
          sourceAccountNumber: '1111111111',
          destinationAccountNumber: '9999999999',
          amount: '1',
        }),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
