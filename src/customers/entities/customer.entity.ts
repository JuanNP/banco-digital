import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity.js';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('customers')
export class Customer {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
        
    @Field()
    @Column({ name: 'first_name', length: 100 })
    firstName: string;
    
    @Field()
    @Column({ name: 'last_name', length: 100 })
    lastName: string;
    
    @Field()
    @Column({ name: 'document_id', length: 30, unique: true })
    documentId: string;
    
    @Field()
    @Column({ length: 150, unique: true })
    email: string;
    
    @Field()
    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string | null;
    
    @OneToMany(() => Account, (account) => account.customer)
    accounts: Relation<Account[]>;
    
    @Field()
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
    
    @Field()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}