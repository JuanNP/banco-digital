import { registerEnumType } from '@nestjs/graphql';

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    TRANSFER = 'TRANSFER',
}

registerEnumType(TransactionType, { name: 'Currency' });