import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity.js';
import { Currency } from '../../common/enums/currency.enum.js';
import { AccountStatus } from '../../common/enums/account-status.enum.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('accounts')
export class Account {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'account_number', length: 20, unique: true })
  accountNumber: string;

  @Field(() => Currency)
  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Field({ description: 'Decimal amount as string, e.g. "1500.00"' })
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance: string;

  @Field(() => AccountStatus)
  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Field(() => ID)
  @Index()
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.accounts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer>;

  @Field()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
