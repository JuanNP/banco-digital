import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module.js';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionsResolver } from './transactions.resolver.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AccountsModule,
    ExchangeRatesModule,
  ],
  providers: [TransactionsService, TransactionsResolver],
})
export class TransactionsModule {}
