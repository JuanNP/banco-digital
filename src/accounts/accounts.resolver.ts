import { ParseUUIDPipe } from '@nestjs/common';
import {
  Args,
  ID,
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

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly customersService: CustomersService,
  ) {}

  @Query(() => Account)
  account(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.accountsService.findOne(id);
  }

  @Mutation(() => Account)
  openAccount(@Args('input') input: OpenAccountInput) {
    return this.accountsService.open(input);
  }

  @Mutation(() => Account)
  freezeAccount(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.accountsService.freeze(id);
  }

  @Mutation(() => Account)
  unfreezeAccount(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.accountsService.unfreeze(id);
  }

  @Mutation(() => Account)
  closeAccount(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.accountsService.close(id);
  }

  @ResolveField(() => Customer)
  customer(@Parent() account: Account) {
    return this.customersService.findOne(account.customerId);
  }
}
