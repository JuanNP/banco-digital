import type { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CacheService } from '../cache/cache.service.js';
import { Currency } from '../common/enums/currency.enum.js';
import type { ExchangeRate } from './entities/exchange-rate.entity.js';
import { ExchangeRatesService } from './exchange-rates.service.js';

describe('ExchangeRatesService', () => {
  let repository: {
    findOneBy: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let cache: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };
  let service: ExchangeRatesService;

  beforeEach(() => {
    repository = {
      findOneBy: vi.fn(async () => ({ rate: '63.500000' })),
      create: vi.fn((data) => ({ ...data })),
      save: vi.fn(async (entities) => entities),
    };
    cache = { get: vi.fn(async () => undefined), set: vi.fn(), del: vi.fn() };

    service = new ExchangeRatesService(
      repository as unknown as Repository<ExchangeRate>,
      cache as unknown as CacheService,
    );
  });

  it('returns 1 for the same currency without querying anything', async () => {
    const rate = await service.getRate(Currency.USD, Currency.USD);

    expect(rate.toString()).toBe('1');
    expect(cache.get).not.toHaveBeenCalled();
    expect(repository.findOneBy).not.toHaveBeenCalled();
  });

  it('uses the cached rate when available', async () => {
    cache.get.mockResolvedValue('64.000000');

    const rate = await service.getRate(Currency.USD, Currency.DOP);

    expect(rate.toFixed(2)).toBe('64.00');
    expect(repository.findOneBy).not.toHaveBeenCalled();
  });

  it('reads from the database on a cache miss and caches the result', async () => {
    const rate = await service.getRate(Currency.USD, Currency.DOP);

    expect(rate.toFixed(2)).toBe('63.50');
    expect(cache.set).toHaveBeenCalledWith(
      'rate:USD:DOP',
      '63.500000',
      expect.any(Number),
    );
  });

  it('fails with RATE_NOT_AVAILABLE when the pair does not exist', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.getRate(Currency.EUR, Currency.DOP),
    ).rejects.toMatchObject({
      response: { code: 'RATE_NOT_AVAILABLE' },
    });
  });

  it('updates the inverse rate and invalidates both cache keys', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await service.setRate({
      baseCurrency: Currency.USD,
      targetCurrency: Currency.DOP,
      rate: '64',
    });

    const [[saved]] = repository.save.mock.calls;
    expect(saved).toEqual([
      expect.objectContaining({
        baseCurrency: Currency.USD,
        targetCurrency: Currency.DOP,
        rate: '64.000000',
      }),
      expect.objectContaining({
        baseCurrency: Currency.DOP,
        targetCurrency: Currency.USD,
        rate: '0.015625',
      }),
    ]);
    expect(cache.del).toHaveBeenCalledWith('rate:USD:DOP', 'rate:DOP:USD');
  });
});
