import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
})
export class AccountsModule {}