import { InputType } from '@nestjs/graphql';
import { DepositInput } from './deposit.input.js';

@InputType()
export class WithdrawInput extends DepositInput {}
