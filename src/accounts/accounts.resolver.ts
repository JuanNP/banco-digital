import { ParseUUIDPipe } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Customer } from '../customers/entities/customer.entity.js';
import { CustomersService } from '../customers/customers.service.js';
import { AccountsService } from './accounts.service.js';
import { OpenAccountInput } from './dto/open-account.input.js';
import { Account } from './entities/account.entity.js';
import { AccountNumberArgs } from './dto/account-number.args.js';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly customersService: CustomersService,
  ) {}

    @Query(() => Account)
  account(@Args() { accountNumber }: AccountNumberArgs) {
    return this.accountsService.findByNumber(accountNumber);
  }

  @Mutation(() => Account)
  openAccount(@Args('input') input: OpenAccountInput) {
    return this.accountsService.open(input);
  }

  @Mutation(() => Account)
  freezeAccount(@Args() { accountNumber }: AccountNumberArgs) {
    return this.accountsService.freeze(accountNumber);
  }

  @Mutation(() => Account)
  unfreezeAccount(@Args() { accountNumber }: AccountNumberArgs) {
    return this.accountsService.unfreeze(accountNumber);
  }

  @Mutation(() => Account)
  closeAccount(@Args() { accountNumber }: AccountNumberArgs) {
    return this.accountsService.close(accountNumber);
  }

  @ResolveField(() => Customer)
  customer(@Parent() account: Account) {
    return this.customersService.findOne(account.customerId);
  }
}
