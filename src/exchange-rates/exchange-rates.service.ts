import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Decimal } from 'decimal.js';
import { Repository } from 'typeorm';
import { Currency } from '../common/enums/currency.enum.js';
import { BusinessRuleException } from '../common/errors/business-rule.exception.js';
import { SetExchangeRateInput } from './dto/set-exchange-rate.input.js';
import { ExchangeRate } from './entities/exchange-rate.entity.js';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly ratesRepository: Repository<ExchangeRate>,
  ) {}

  findAll(): Promise<ExchangeRate[]> {
    return this.ratesRepository.find({ order: { baseCurrency: 'ASC', targetCurrency: 'ASC' } });
  }

  async getRate(from: Currency, to: Currency): Promise<Decimal> {
    if (from === to) return new Decimal(1);

    const rate = await this.ratesRepository.findOneBy({ baseCurrency: from, targetCurrency: to });
    if (!rate) {
      throw new BusinessRuleException('RATE_NOT_AVAILABLE', `No exchange rate for ${from} -> ${to}`);
    }
    return new Decimal(rate.rate);
  }

  async setRate({ baseCurrency, targetCurrency, rate }: SetExchangeRateInput): Promise<ExchangeRate> {
    if (baseCurrency === targetCurrency) {
      throw new BusinessRuleException('INVALID_RATE', 'Base and target currency must be different');
    }

    const value = new Decimal(rate);
    if (value.isZero()) {
      throw new BusinessRuleException('INVALID_RATE', 'Rate must be greater than zero');
    }

    const [direct] = await this.ratesRepository.save([
      await this.upsertEntity(baseCurrency, targetCurrency, value),
      await this.upsertEntity(targetCurrency, baseCurrency, new Decimal(1).div(value)),
    ]);
    return direct;
  }

  private async upsertEntity(base: Currency, target: Currency, rate: Decimal) {
    const existing = await this.ratesRepository.findOneBy({ baseCurrency: base, targetCurrency: target });
    const entity = existing ?? this.ratesRepository.create({ baseCurrency: base, targetCurrency: target });
    entity.rate = rate.toFixed(6);
    return entity;
  }
}