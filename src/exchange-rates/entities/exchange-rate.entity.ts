import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum.js';

@Entity('exchange_rates')
@Unique(['baseCurrency', 'targetCurrency'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'base_currency', type: 'enum', enum: Currency })
  baseCurrency: Currency;

  @Column({ name: 'target_currency', type: 'enum', enum: Currency })
  targetCurrency: Currency;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  rate: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}