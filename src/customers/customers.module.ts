import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity.js';
import { CustomersService } from './customers.service.js';
import { CustomersResolver } from './customers.resolver.js';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersService, CustomersResolver],
  exports: [CustomersService],
})
export class CustomersModule {}