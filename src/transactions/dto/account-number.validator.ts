import { Matches } from 'class-validator';

export const IsAccountNumber = () =>
  Matches(/^\d{10}$/, { message: 'accountNumber must be 10 digits' });