import { Matches } from 'class-validator';

export const IsMoneyAmount = () =>
  Matches(/^\d{1,16}(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimals',
  });
