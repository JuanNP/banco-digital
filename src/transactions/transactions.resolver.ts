import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from '../common/dto/pagination.args.js';
import { DepositInput } from './dto/deposit.input.js';
import { TransferInput } from './dto/transfer.input.js';
import { WithdrawInput } from './dto/withdraw.input.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionsService } from './transactions.service.js';
import { AccountNumberArgs } from '../accounts/dto/account-number.args.js';

@Resolver(() => Transaction)
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Query(() => Transaction)
  transaction(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

    @Query(() => [Transaction])
  accountTransactions(
    @Args() { accountNumber }: AccountNumberArgs,
    @Args() pagination: PaginationArgs,
  ) {
    return this.transactionsService.findByAccount(accountNumber, pagination);
  }

  @Mutation(() => Transaction)
  deposit(@Args('input') input: DepositInput) {
    return this.transactionsService.deposit(input);
  }

  @Mutation(() => Transaction)
  withdraw(@Args('input') input: WithdrawInput) {
    return this.transactionsService.withdraw(input);
  }

  @Mutation(() => Transaction)
  transfer(@Args('input') input: TransferInput) {
    return this.transactionsService.transfer(input);
  }
}