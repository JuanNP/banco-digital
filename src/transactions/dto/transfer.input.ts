import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsAccountNumber } from '../../common/validators/account-number.validator.js';
import { IsMoneyAmount } from './amount.validator.js';

@InputType()
export class TransferInput {
  @Field()
  @IsAccountNumber()
  sourceAccountNumber: string;

  @Field()
  @IsAccountNumber()
  destinationAccountNumber: string;

  @Field({ description: 'Amount in the source account currency' })
  @IsMoneyAmount()
  amount: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}