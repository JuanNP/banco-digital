import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity.js';
import { CustomersService } from './customers.service.js';
import { CustomersResolver } from './customers.resolver.js';
import { CustomersSearchService } from './customers-search.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersService, CustomersResolver, CustomersSearchService],
  exports: [CustomersService],
})
export class CustomersModule {}
