import { Client } from '@elastic/elasticsearch';
import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ELASTIC_CLIENT } from '../search/search.constants.js';
import { Customer } from './entities/customer.entity.js';

const INDEX = 'customers';

type CustomerDocument = Pick<Customer, 'firstName' | 'lastName' | 'email' | 'documentId'>;

@Injectable()
export class CustomersSearchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CustomersSearchService.name);

  constructor(
    @Inject(ELASTIC_CLIENT) private readonly client: Client,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const exists = await this.client.indices.exists({ index: INDEX });
      if (!exists) {
        await this.createIndex();
        await this.reindexAll();
      }
    } catch (error) {
      this.logger.warn(`Elasticsearch not available on startup: ${(error as Error).message}`);
    }
  }

  async index(customer: Customer): Promise<void> {
    try {
      await this.client.index({
        index: INDEX,
        id: customer.id,
        document: this.toDocument(customer),
      });
    } catch (error) {
      this.logger.warn(`Could not index customer ${customer.id}: ${(error as Error).message}`);
    }
  }

  async search(term: string, limit: number): Promise<string[]> {
    const result = await this.client.search<CustomerDocument>({
      index: INDEX,
      size: limit,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: term,
                fields: ['firstName^2', 'lastName^2', 'email'],
                fuzziness: 'AUTO',
              },
            },
            { term: { documentId: { value: term, boost: 5 } } },
          ],
          minimum_should_match: 1,
        },
      },
    });

    return result.hits.hits.map((hit) => hit._id!);
  }

  async reindexAll(): Promise<number> {
    const customers = await this.customersRepository.find();
    if (customers.length === 0) return 0;

    await this.client.bulk({
      refresh: true,
      operations: customers.flatMap((customer) => [
        { index: { _index: INDEX, _id: customer.id } },
        this.toDocument(customer),
      ]),
    });

    this.logger.log(`Reindexed ${customers.length} customers`);
    return customers.length;
  }

  private async createIndex() {
    await this.client.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          firstName: { type: 'text' },
          lastName: { type: 'text' },
          email: { type: 'text' },
          documentId: { type: 'keyword' },
        },
      },
    });
    this.logger.log(`Created index "${INDEX}"`);
  }

  private toDocument({ firstName, lastName, email, documentId }: Customer): CustomerDocument {
    return { firstName, lastName, email, documentId };
  }
}