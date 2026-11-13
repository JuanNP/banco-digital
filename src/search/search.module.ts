import { Client } from '@elastic/elasticsearch';
import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ELASTIC_CLIENT } from './search.constants.js';

@Global()
@Module({
  providers: [
    {
      provide: ELASTIC_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Client({
          node: config.get<string>('ELASTIC_NODE'),
          requestTimeout: 3000,
          maxRetries: 1,
        }),
    },
  ],
  exports: [ELASTIC_CLIENT],
})
export class SearchModule implements OnModuleDestroy {
  constructor(@Inject(ELASTIC_CLIENT) private readonly client: Client) {}

  async onModuleDestroy() {
    await this.client.close();
  }
}
