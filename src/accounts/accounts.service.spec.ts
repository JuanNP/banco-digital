import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus } from '../common/enums/account-status.enum.js';
import { Currency } from '../common/enums/currency.enum.js';
import type { CustomersService } from '../customers/customers.service.js';
import { AccountsService } from './accounts.service.js';
import { Account } from './entities/account.entity.js';

describe('AccountsService', () => {
  let account: Account;
  let repository: {
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let service: AccountsService;

  beforeEach(() => {
    account = Object.assign(new Account(), {
      id: 'b0c1f7a2-6f1e-4a5b-9c1d-2e3f4a5b6c7d',
      accountNumber: '1234567890',
      currency: Currency.USD,
      balance: '0.00',
      status: AccountStatus.ACTIVE,
    });

    repository = {
      findOneBy: vi.fn(async (where: Partial<Account>) =>
        where.id === account.id || where.accountNumber === account.accountNumber
          ? account
          : null,
      ),
      save: vi.fn(async (entity) => entity),
    };

    service = new AccountsService(
      repository as unknown as Repository<Account>,
      {} as CustomersService,
    );
  });

  it('finds an account by id and by account number', async () => {
    await expect(service.findOne(account.id)).resolves.toBe(account);
    await expect(service.findByNumber('1234567890')).resolves.toBe(account);
  });

  it('throws NotFound for an unknown account number', async () => {
    await expect(service.findByNumber('0000000000')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('freezes an active account', async () => {
    const frozen = await service.freeze('1234567890');

    expect(frozen.status).toBe(AccountStatus.FROZEN);
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('does not save when the status is already the requested one', async () => {
    await service.unfreeze('1234567890');

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('refuses to close an account with balance', async () => {
    account.balance = '0.01';

    await expect(service.close('1234567890')).rejects.toMatchObject({
      response: { code: 'ACCOUNT_HAS_BALANCE' },
    });
  });

  it('does not allow changes on a closed account', async () => {
    await service.close('1234567890');

    await expect(service.freeze('1234567890')).rejects.toMatchObject({
      response: { code: 'ACCOUNT_CLOSED' },
    });
  });
});
