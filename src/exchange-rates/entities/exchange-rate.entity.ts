import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum.js';
import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
@Entity('exchange_rates')
@Unique(['baseCurrency', 'targetCurrency'])
export class ExchangeRate {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Currency)
  @Column({ name: 'base_currency', type: 'enum', enum: Currency })
  baseCurrency: Currency;

  @Field(() => Currency)
  @Column({ name: 'target_currency', type: 'enum', enum: Currency })
  targetCurrency: Currency;

  @Field()
  @Column({ type: 'numeric', precision: 18, scale: 6 })
  rate: string;

  @Field()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}