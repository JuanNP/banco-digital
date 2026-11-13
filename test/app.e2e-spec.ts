import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Banco Digital (e2e)', () => {
  let app: INestApplication;

  const gql = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports every dependency as up', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body.details).toMatchObject({
      database: { status: 'up' },
      redis: { status: 'up' },
      elasticsearch: { status: 'up' },
    });
  });

  it('returns BAD_USER_INPUT with details for invalid input', async () => {
    const res = await gql(`
      mutation {
        createCustomer(input: { firstName: "A", lastName: "B", documentId: "x", email: "not-an-email" }) { id }
      }
    `);

    const [error] = res.body.errors;
    expect(error.extensions.code).toBe('BAD_USER_INPUT');
    expect(error.extensions.details).toEqual(
      expect.arrayContaining([
        'email must be an email',
        'documentId format is invalid',
      ]),
    );
  });

  it('creates a customer, opens accounts and transfers between currencies', async () => {
    const unique = randomInt(1_000_000, 9_999_999);

    const customerRes = await gql(
      `mutation ($input: CreateCustomerInput!) { createCustomer(input: $input) { id } }`,
      {
        input: {
          firstName: 'Test',
          lastName: 'E2E',
          documentId: `E2E-${unique}`,
          email: `e2e-${unique}@example.com`,
        },
      },
    );
    const customerId = customerRes.body.data.createCustomer.id;

    const openAccount = async (currency: string) => {
      const res = await gql(
        `mutation ($input: OpenAccountInput!) { openAccount(input: $input) { accountNumber } }`,
        { input: { customerId, currency } },
      );
      return res.body.data.openAccount.accountNumber as string;
    };
    const dopAccount = await openAccount('DOP');
    const usdAccount = await openAccount('USD');

    await gql(
      `mutation { deposit(input: { accountNumber: "${dopAccount}", amount: "10000" }) { id } }`,
    );

    const transferRes = await gql(`
      mutation {
        transfer(input: { sourceAccountNumber: "${dopAccount}", destinationAccountNumber: "${usdAccount}", amount: "500" }) {
          convertedAmount
          exchangeRate
        }
      }
    `);
    expect(transferRes.body.errors).toBeUndefined();
    expect(transferRes.body.data.transfer.exchangeRate).not.toBeNull();

    const balancesRes = await gql(`
      query { customer(id: "${customerId}") { accounts { currency balance } } }
    `);
    const balances = Object.fromEntries(
      balancesRes.body.data.customer.accounts.map(
        (a: { currency: string; balance: string }) => [a.currency, a.balance],
      ),
    );
    expect(balances.DOP).toBe('9500.00');
    expect(balances.USD).toBe(transferRes.body.data.transfer.convertedAmount);
  });

  it('rejects a withdrawal larger than the balance with INSUFFICIENT_FUNDS', async () => {
    const unique = randomInt(1_000_000, 9_999_999);
    const customerRes = await gql(
      `mutation ($input: CreateCustomerInput!) { createCustomer(input: $input) { id } }`,
      {
        input: {
          firstName: 'Test',
          lastName: 'Funds',
          documentId: `E2E-${unique}`,
          email: `funds-${unique}@example.com`,
        },
      },
    );
    const accountRes = await gql(
      `mutation ($input: OpenAccountInput!) { openAccount(input: $input) { accountNumber } }`,
      {
        input: {
          customerId: customerRes.body.data.createCustomer.id,
          currency: 'EUR',
        },
      },
    );
    const accountNumber = accountRes.body.data.openAccount.accountNumber;

    const res = await gql(
      `mutation { withdraw(input: { accountNumber: "${accountNumber}", amount: "1" }) { id } }`,
    );

    expect(res.body.errors[0].extensions.code).toBe('INSUFFICIENT_FUNDS');
  });
});
