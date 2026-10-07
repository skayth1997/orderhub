import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';

describe('Orders security (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const run = Date.now();
  const password = 'secret123';
  const tenantIds: string[] = [];

  let adminAToken: string;
  let viewerAToken: string;
  let adminBToken: string;
  let orderOfTenantA: { id: string };

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

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    dataSource = app.get(DataSource);

    adminAToken = await registerCompany('Tenant A', `admin-a-${run}@test.com`);
    adminBToken = await registerCompany('Tenant B', `admin-b-${run}@test.com`);

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ email: `viewer-a-${run}@test.com`, password, role: 'viewer' })
      .expect(201);
    viewerAToken = await login(`viewer-a-${run}@test.com`);

    const res = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ customerName: 'Ann', product: 'Pen', quantity: 2 })
      .expect(201);
    orderOfTenantA = res.body;
  });

  afterAll(async () => {
    for (const table of ['orders', 'users', 'tenants']) {
      const column = table === 'tenants' ? 'id' : '"tenantId"';
      await dataSource.query(`DELETE FROM ${table} WHERE ${column} = ANY($1)`, [
        tenantIds,
      ]);
    }
    await app.close();
  });

  it('returns 401 when there is no token', async () => {
    await request(app.getHttpServer()).get('/orders').expect(401);
  });

  it('returns 403 when a viewer tries to create an order', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${viewerAToken}`)
      .send({ customerName: 'Bob', product: 'Book', quantity: 1 })
      .expect(403);
  });

  it('does not show tenant A orders in the list of tenant B', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${adminBToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('returns 404 when tenant B opens an order of tenant A', async () => {
    await request(app.getHttpServer())
      .get(`/orders/${orderOfTenantA.id}`)
      .set('Authorization', `Bearer ${adminBToken}`)
      .expect(404);
  });

  it('lets tenant A open its own order', async () => {
    const res = await request(app.getHttpServer())
      .get(`/orders/${orderOfTenantA.id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .expect(200);

    expect(res.body.id).toBe(orderOfTenantA.id);
  });
});
