import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module.js';
import { AccountsResolver } from './accounts.resolver.js';
import { AccountsService } from './accounts.service.js';
import { CustomerAccountsResolver } from './customer-accounts.resolver.js';
import { Account } from './entities/account.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), CustomersModule],
  providers: [AccountsService, AccountsResolver, CustomerAccountsResolver],
  exports: [AccountsService],
})
export class AccountsModule {}
