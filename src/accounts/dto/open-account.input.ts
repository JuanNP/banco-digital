import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { Currency } from '../../common/enums/currency.enum.js';

@InputType()
export class OpenAccountInput {
  @Field(() => ID)
  @IsUUID()
  customerId: string;

  @Field(() => Currency)
  @IsEnum(Currency)
  currency: Currency;
}
