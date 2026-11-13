import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsMoneyAmount } from './amount.validator.js';
import { IsAccountNumber } from '../../common/validators/account-number.validator.js';

@InputType()
export class DepositInput {
  @Field()
  @IsAccountNumber()
  accountNumber: string;

  @Field()
  @IsMoneyAmount()
  amount: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}