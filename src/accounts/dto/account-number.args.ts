import { ArgsType, Field } from '@nestjs/graphql';
import { IsAccountNumber } from '../../common/validators/account-number.validator.js';

@ArgsType()
export class AccountNumberArgs {
  @Field()
  @IsAccountNumber()
  accountNumber: string;
}
