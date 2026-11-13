import { Client } from '@elastic/elasticsearch';
import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { ELASTIC_CLIENT } from '../search/search.constants.js';

@Injectable()
export class ElasticsearchHealthIndicator {
  constructor(
    @Inject(ELASTIC_CLIENT) private readonly client: Client,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        await this.client.ping();
      })
      .withTimeout(1500);
  }
}
