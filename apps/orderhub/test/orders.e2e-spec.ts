import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';

describe('Orders security (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  // Unique emails for every run, so the tests can be run again and again.
  const run = Date.now();
  const password = 'secret123';
  const tenantIds: string[] = [];

  let adminAToken: string;
  let viewerAToken: string;
  let adminBToken: string;
  let orderOfTenantA: { id: string };

  // Registers a company and logs in as its first admin. Returns the token.
  async function registerCompany(name: string, email: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ companyName: name, email, password })
      .expect(201);
    tenantIds.push(res.body.tenant.id);
    return login(email);
  }

  async function login(email: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same pipe as main.ts, so validation behaves like the real app.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    dataSource = app.get(DataSource);

    // Tenant A: an admin and a viewer. Tenant B: just an admin.
    adminAToken = await registerCompany('Tenant A', `admin-a-${run}@test.com`);
    adminBToken = await registerCompany('Tenant B', `admin-b-${run}@test.com`);

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ email: `viewer-a-${run}@test.com`, password, role: 'viewer' })
      .expect(201);
    viewerAToken = await login(`viewer-a-${run}@test.com`);

    // One order that belongs to tenant A.
    const res = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ customerName: 'Ann', product: 'Pen', quantity: 2 })
      .expect(201);
    orderOfTenantA = res.body;
  });

  afterAll(async () => {
    // Remove the data this test file created (children before parents).
    for (const table of ['orders', 'users', 'tenants']) {
      const column = table === 'tenants' ? 'id' : '"tenantId"';
      await dataSource.query(`DELETE FROM ${table} WHERE ${column} = ANY($1)`, [
        tenantIds,
      ]);
    }
    await app.close();
  });

  // Test 1: the guard must turn away anyone who is not logged in.
  it('returns 401 when there is no token', async () => {
    await request(app.getHttpServer()).get('/orders').expect(401);
  });

  // Test 2: a viewer is logged in, but viewers may only read.
  // The roles guard must answer "403 Forbidden", not 401 and not 201.
  it('returns 403 when a viewer tries to create an order', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${viewerAToken}`)
      .send({ customerName: 'Bob', product: 'Book', quantity: 1 })
      .expect(403);
  });

  // Test 3: tenant B asks for the list of orders. Tenant A has an order,
  // but tenant B must get an empty list and never see it.
  it('does not show tenant A orders in the list of tenant B', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${adminBToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  // Test 4: tenant B knows the exact ID of tenant A's order and asks for it.
  // The answer must be 404, as if the order did not exist at all.
  it('returns 404 when tenant B opens an order of tenant A', async () => {
    await request(app.getHttpServer())
      .get(`/orders/${orderOfTenantA.id}`)
      .set('Authorization', `Bearer ${adminBToken}`)
      .expect(404);
  });

  // Test 5 (a safety check for the tests above): the owner CAN open it.
  // Without this, test 4 could pass just because the order was never created.
  it('lets tenant A open its own order', async () => {
    const res = await request(app.getHttpServer())
      .get(`/orders/${orderOfTenantA.id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .expect(200);

    expect(res.body.id).toBe(orderOfTenantA.id);
  });
});
