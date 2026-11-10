import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity.js';
import { Currency } from '../../common/enums/currency.enum.js';
import { TransactionType } from '../../common/enums/transaction-type.enum.js';

@Entity('transactions')
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Index()
  @Column({ name: 'source_account_id', type: 'uuid', nullable: true })
  sourceAccountId: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount: Relation<Account> | null;

  @Index()
  @Column({ name: 'destination_account_id', type: 'uuid', nullable: true })
  destinationAccountId: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: Relation<Account> | null;

  @Column({
    name: 'converted_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  convertedAmount: string | null;

  @Column({
    name: 'exchange_rate',
    type: 'numeric',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  exchangeRate: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}