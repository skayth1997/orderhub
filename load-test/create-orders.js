import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TENANTS = 10;

export const options = {
  vus: 20,
  duration: '1m',
};

export function setup() {
  const run = Date.now();
  const json = { headers: { 'Content-Type': 'application/json' } };
  const tokens = [];

  for (let i = 0; i < TENANTS; i++) {
    const email = `load-${run}-${i}@test.com`;
    const body = JSON.stringify({
      companyName: `Load ${run} ${i}`,
      email,
      password: 'secret123',
    });
    http.post(`${BASE_URL}/auth/register`, body, json);
    const login = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email, password: 'secret123' }),
      json,
    );
    tokens.push(login.json('accessToken'));
  }
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % TENANTS];
  const res = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({ customerName: 'Load Test', product: 'Lamp', quantity: 1 }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
  check(res, { 'status is 201': (r) => r.status === 201 });
}
