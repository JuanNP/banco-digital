import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
})
export class ExchangeRatesModule {}