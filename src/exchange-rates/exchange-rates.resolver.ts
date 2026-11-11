import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SetExchangeRateInput } from './dto/set-exchange-rate.input.js';
import { ExchangeRate } from './entities/exchange-rate.entity.js';
import { ExchangeRatesService } from './exchange-rates.service.js';

@Resolver(() => ExchangeRate)
export class ExchangeRatesResolver {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Query(() => [ExchangeRate])
  exchangeRates() {
    return this.exchangeRatesService.findAll();
  }

  @Mutation(() => ExchangeRate)
  setExchangeRate(@Args('input') input: SetExchangeRateInput) {
    return this.exchangeRatesService.setRate(input);
  }
}