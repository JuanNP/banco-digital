import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Customer } from '../customers/entities/customer.entity.js';
import { AccountsService } from './accounts.service.js';
import { Account } from './entities/account.entity.js';

@Resolver(() => Customer)
export class CustomerAccountsResolver {
  constructor(private readonly accountsService: AccountsService) {}

  @ResolveField(() => [Account])
  accounts(@Parent() customer: Customer) {
    return this.accountsService.findByCustomer(customer.id);
  }
}
