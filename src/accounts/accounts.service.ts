import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Decimal } from 'decimal.js';
import { Repository } from 'typeorm';
import { AccountStatus } from '../common/enums/account-status.enum.js';
import { BusinessRuleException } from '../common/errors/business-rule.exception.js';
import { CustomersService } from '../customers/customers.service.js';
import { OpenAccountInput } from './dto/open-account.input.js';
import { Account } from './entities/account.entity.js';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly customersService: CustomersService,
  ) {}

  async open({ customerId, currency }: OpenAccountInput): Promise<Account> {
    await this.customersService.findOne(customerId);

    const account = this.accountsRepository.create({
      customerId,
      currency,
      accountNumber: await this.generateAccountNumber(),
    });
    return this.accountsRepository.save(account);
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountsRepository.findOneBy({ id });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }

  async findByNumber(accountNumber: string): Promise<Account> {
    const account = await this.accountsRepository.findOneBy({ accountNumber });
    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }
    return account;
  }

  findByCustomer(customerId: string): Promise<Account[]> {
    return this.accountsRepository.find({
      where: { customerId },
      order: { createdAt: 'ASC' },
    });
  }

  async freeze(accountNumber: string) {
    return this.changeStatus(
      await this.findByNumber(accountNumber),
      AccountStatus.FROZEN,
    );
  }

  async unfreeze(accountNumber: string) {
    return this.changeStatus(
      await this.findByNumber(accountNumber),
      AccountStatus.ACTIVE,
    );
  }

  async close(accountNumber: string): Promise<Account> {
    const account = await this.findByNumber(accountNumber);
    if (!new Decimal(account.balance).isZero()) {
      throw new BusinessRuleException(
        'ACCOUNT_HAS_BALANCE',
        'Only accounts with zero balance can be closed',
      );
    }
    return this.changeStatus(account, AccountStatus.CLOSED);
  }

  private async changeStatus(
    account: Account,
    status: AccountStatus,
  ): Promise<Account> {
    if (account.status === AccountStatus.CLOSED) {
      throw new BusinessRuleException(
        'ACCOUNT_CLOSED',
        'Closed accounts cannot be modified',
      );
    }
    if (account.status === status) {
      return account;
    }

    account.status = status;
    return this.accountsRepository.save(account);
  }

  private async generateAccountNumber(): Promise<string> {
    let accountNumber: string;
    do {
      accountNumber = randomInt(1_000_000_000, 9_999_999_999).toString();
    } while (await this.accountsRepository.existsBy({ accountNumber }));
    return accountNumber;
  }
}
