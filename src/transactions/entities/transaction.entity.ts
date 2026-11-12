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
import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
@Entity('transactions')
@Index(['createdAt'])
export class Transaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => TransactionType)
  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Field()
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: string;

  @Field(() => Currency)
  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Field(() => ID, { nullable: true })
  @Index()
  @Column({ name: 'source_account_id', type: 'uuid', nullable: true })
  sourceAccountId: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount: Relation<Account> | null;

  @Field(() => ID, { nullable: true })
  @Index()
  @Column({ name: 'destination_account_id', type: 'uuid', nullable: true })
  destinationAccountId: string | null;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: Relation<Account> | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'converted_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  convertedAmount: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'exchange_rate',
    type: 'numeric',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  exchangeRate: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Field({ nullable: true })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}