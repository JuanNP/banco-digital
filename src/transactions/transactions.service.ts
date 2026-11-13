import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Decimal } from 'decimal.js';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service.js';
import { Account } from '../accounts/entities/account.entity.js';
import { PaginationArgs } from '../common/dto/pagination.args.js';
import { AccountStatus } from '../common/enums/account-status.enum.js';
import { TransactionType } from '../common/enums/transaction-type.enum.js';
import { BusinessRuleException } from '../common/errors/business-rule.exception.js';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service.js';
import { DepositInput } from './dto/deposit.input.js';
import { TransferInput } from './dto/transfer.input.js';
import { WithdrawInput } from './dto/withdraw.input.js';
import { Transaction } from './entities/transaction.entity.js';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly accountsService: AccountsService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  deposit({
    accountNumber,
    amount,
    description,
  }: DepositInput): Promise<Transaction> {
    const value = this.toAmount(amount);

    return this.dataSource.transaction(async (manager) => {
      const account = await this.lockAccount(manager, accountNumber);
      this.ensureActive(account);

      account.balance = value.plus(account.balance).toFixed(2);
      await manager.save(account);

      const deposit = await manager.save(
        manager.create(Transaction, {
          type: TransactionType.DEPOSIT,
          amount: value.toFixed(2),
          currency: account.currency,
          destinationAccountId: account.id,
          description,
        }),
      );

      this.logger.log(
        `Deposit -> ${account.accountNumber}: ` +
          `${value.toFixed(2)} ${account.currency} ` +
          `Description: ${description}`,
      );

      return deposit;
    });
  }

  withdraw({
    accountNumber,
    amount,
    description,
  }: WithdrawInput): Promise<Transaction> {
    const value = this.toAmount(amount);

    return this.dataSource.transaction(async (manager) => {
      const account = await this.lockAccount(manager, accountNumber);
      this.ensureActive(account);
      this.ensureFunds(account, value);

      account.balance = new Decimal(account.balance).minus(value).toFixed(2);
      await manager.save(account);

      const withdraw = await manager.save(
        manager.create(Transaction, {
          type: TransactionType.WITHDRAWAL,
          amount: value.toFixed(2),
          currency: account.currency,
          sourceAccountId: account.id,
          description,
        }),
      );

      this.logger.log(
        `Withdrawal -> ${account.accountNumber}: ` +
          `${value.toFixed(2)} ${account.currency} ` +
          `Description: ${description}`,
      );

      return withdraw;
    });
  }

  transfer(input: TransferInput): Promise<Transaction> {
    const { sourceAccountNumber, destinationAccountNumber, description } =
      input;
    const value = this.toAmount(input.amount);

    if (sourceAccountNumber === destinationAccountNumber) {
      throw new BusinessRuleException(
        'SAME_ACCOUNT',
        'Cannot transfer to the same account',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const locked = new Map<string, Account>();
      for (const number of [
        sourceAccountNumber,
        destinationAccountNumber,
      ].sort()) {
        locked.set(number, await this.lockAccount(manager, number));
      }
      const source = locked.get(sourceAccountNumber)!;
      const destination = locked.get(destinationAccountNumber)!;

      this.ensureActive(source);
      this.ensureActive(destination);
      this.ensureFunds(source, value);

      const rate = await this.exchangeRatesService.getRate(
        source.currency,
        destination.currency,
      );
      const converted = value
        .mul(rate)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const isConversion = source.currency !== destination.currency;

      source.balance = new Decimal(source.balance).minus(value).toFixed(2);
      destination.balance = converted.plus(destination.balance).toFixed(2);
      await manager.save([source, destination]);

      const transaction = await manager.save(
        manager.create(Transaction, {
          type: TransactionType.TRANSFER,
          amount: value.toFixed(2),
          currency: source.currency,
          sourceAccountId: source.id,
          destinationAccountId: destination.id,
          convertedAmount: isConversion ? converted.toFixed(2) : null,
          exchangeRate: isConversion ? rate.toFixed(6) : null,
          description,
        }),
      );

      this.logger.log(
        `Transfer ${source.accountNumber} -> ${destination.accountNumber}: ` +
          `${value.toFixed(2)} ${source.currency}` +
          (isConversion
            ? ` (${converted.toFixed(2)} ${destination.currency})`
            : ''),
      );

      return transaction;
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOneBy({ id });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }

    async findByAccount(accountNumber: string, { limit, offset }: PaginationArgs): Promise<Transaction[]> {
    const account = await this.accountsService.findByNumber(accountNumber);

    return this.transactionsRepository.find({
      where: [{ sourceAccountId: account.id }, { destinationAccountId: account.id }],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  private async lockAccount(
    manager: EntityManager,
    accountNumber: string,
  ): Promise<Account> {
    const account = await manager.findOne(Account, {
      where: { accountNumber },
      lock: { mode: 'pessimistic_write' },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }
    return account;
  }

  private ensureActive(account: Account) {
    if (account.status !== AccountStatus.ACTIVE) {
      throw new BusinessRuleException(
        'ACCOUNT_NOT_ACTIVE',
        `Account ${account.accountNumber} is ${account.status.toLowerCase()}`,
      );
    }
  }

  private ensureFunds(account: Account, amount: Decimal) {
    if (new Decimal(account.balance).lessThan(amount)) {
      throw new BusinessRuleException(
        'INSUFFICIENT_FUNDS',
        'Insufficient funds',
      );
    }
  }

  private toAmount(raw: string): Decimal {
    const value = new Decimal(raw);
    if (value.lessThanOrEqualTo(0)) {
      throw new BadRequestException('amount must be greater than zero');
    }
    return value;
  }
}
