import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { RedisHealthIndicator } from './redis.health.js';
import { ElasticsearchHealthIndicator } from './elasticsearch.health.js';

@Module({
  imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' })],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, ElasticsearchHealthIndicator],
})
export class HealthModule {}
