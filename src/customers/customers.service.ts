import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { CreateCustomerInput } from './dto/create-customer.input.js';
import { UpdateCustomerInput } from './dto/update-customer.input.js';
import { PaginationArgs } from '../common/dto/pagination.args.js';
import { CustomersSearchService } from './customers-search.service.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly customersSearch: CustomersSearchService,
  ) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    await this.ensureUnique(input.email, input.documentId);
    const customer = await this.customersRepository.save(
      this.customersRepository.create(input),
    );
    await this.customersSearch.index(customer);
    return customer;
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

    const updated = await this.customersRepository.save(customer);
    await this.customersSearch.index(updated);
    return updated;
  }

  async search(term: string, limit: number): Promise<Customer[]> {
    const ids = await this.customersSearch.search(term, limit);
    if (ids.length === 0) return [];

    const customers = await this.customersRepository.findBy({ id: In(ids) });
    const byId = new Map(customers.map((customer) => [customer.id, customer]));
    return ids
      .map((id) => byId.get(id))
      .filter((customer) => customer !== undefined);
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
