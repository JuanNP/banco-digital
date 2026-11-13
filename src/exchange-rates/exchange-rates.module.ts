import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity.js';
import { ExchangeRatesResolver } from './exchange-rates.resolver.js';
import { ExchangeRatesService } from './exchange-rates.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  providers: [ExchangeRatesService, ExchangeRatesResolver],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
