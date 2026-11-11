import { registerEnumType } from '@nestjs/graphql';
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

registerEnumType(AccountStatus, { name: 'AccountStatus' });
