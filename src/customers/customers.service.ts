import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { CreateCustomerInput } from './dto/create-customer.input.js';
import { UpdateCustomerInput } from './dto/update-customer.input.js';
import { PaginationArgs } from '../common/dto/pagination.args.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    await this.ensureUnique(input.email, input.documentId);
    const customer = this.customersRepository.create(input);
    return this.customersRepository.save(customer);
  }

  findAll({ limit, offset }: PaginationArgs): Promise<Customer[]> {
    return this.customersRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const customer = await this.findOne(id);
    await this.ensureUnique(input.email, input.documentId, id);
    Object.assign(customer, input);
    return this.customersRepository.save(customer);
  }

  private async ensureUnique(
    email?: string,
    documentId?: string,
    excludeId?: string,
  ): Promise<void> {
    if (!email && !documentId) return;

    const existing = await this.customersRepository.findOne({
      where: [
        ...(email ? [{ email }] : []),
        ...(documentId ? [{ documentId }] : []),
      ],
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        'A customer with this email or documentId already exists',
      );
    }
  }
}