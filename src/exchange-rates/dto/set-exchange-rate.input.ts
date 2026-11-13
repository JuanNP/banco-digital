import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, Matches } from 'class-validator';
import { Currency } from '../../common/enums/currency.enum.js';

@InputType()
export class SetExchangeRateInput {
  @Field(() => Currency)
  @IsEnum(Currency)
  baseCurrency: Currency;

  @Field(() => Currency)
  @IsEnum(Currency)
  targetCurrency: Currency;

  @Field()
  @Matches(/^\d{1,12}(\.\d{1,6})?$/, {
    message: 'rate must be a positive decimal with up to 6 places',
  })
  rate: string;
}
