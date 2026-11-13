import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { Customer } from './entities/customer.entity.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerInput } from './dto/create-customer.input.js';
import { UpdateCustomerInput } from './dto/update-customer.input.js';
import { PaginationArgs } from '../common/dto/pagination.args.js';
import { CustomersSearchService } from './customers-search.service.js';
import { SearchCustomersArgs } from './dto/search-customers.args.js';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(
    private readonly customersService: CustomersService,
    private readonly customersSearch: CustomersSearchService,
  ) {}

  @Query(() => [Customer], { name: 'customers' })
  findAll(@Args() pagination: PaginationArgs): Promise<Customer[]> {
    return this.customersService.findAll(pagination);
  }

  @Query(() => Customer, { name: 'customer' })
  findOne(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Mutation(() => Customer)
  createCustomer(@Args('input') input: CreateCustomerInput): Promise<Customer> {
    return this.customersService.create(input);
  }

  @Mutation(() => Customer)
  updateCustomer(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('input') input: UpdateCustomerInput,
  ): Promise<Customer> {
    return this.customersService.update(id, input);
  }

  @Query(() => [Customer])
  searchCustomers(@Args() { term, limit }: SearchCustomersArgs) {
    return this.customersService.search(term, limit);
  }

  @Mutation(() => Int, {
    description: 'Rebuilds the customers search index from PostgreSQL',
  })
  reindexCustomers() {
    return this.customersSearch.reindexAll();
  }
}
