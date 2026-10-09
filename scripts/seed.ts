// Fills a running OrderHub with demo data. Safe to run more than once.
// Usage: pnpm seed   (the three apps must be running)

const ORDERHUB = process.env.ORDERHUB_URL ?? 'http://localhost:3000';
const INVENTORY = process.env.INVENTORY_URL ?? 'http://localhost:3001';

const PASSWORD = 'Demo12345';
const ADMIN = 'admin@demo.com';
const USERS = [
  { email: 'manager@demo.com', role: 'manager' },
  { email: 'viewer@demo.com', role: 'viewer' },
];

const STOCK: Record<string, number> = {
  Lamp: 40,
  Desk: 12,
  Chair: 25,
  Monitor: 8,
  Keyboard: 60,
  Headphones: 3,
  Webcam: 0,
};

const ORDERS = [
  ['Ann Smith', 'Lamp', 2],
  ['Bob Jones', 'Desk', 1],
  ['Carla Diaz', 'Chair', 4],
  ['Dmitri Petrov', 'Monitor', 2],
  ['Eva Novak', 'Keyboard', 10],
  ['Frank Miller', 'Headphones', 5], // too many: rejected
  ['Grace Lee', 'Lamp', 3],
  ['Hiro Tanaka', 'Webcam', 1], // out of stock: rejected
  ['Ivy Chen', 'Chair', 2],
  ['Jack Wilson', 'Monitor', 1],
  ['Kara Singh', 'Desk', 20], // too many: rejected
  ['Leo Martin', 'Keyboard', 5],
] as const;

async function call(method: string, url: string, token?: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

async function login(email: string): Promise<string> {
  const res = await call('POST', `${ORDERHUB}/auth/login`, undefined, {
    email,
    password: PASSWORD,
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken;
}

const reg = await call('POST', `${ORDERHUB}/auth/register`, undefined, {
  companyName: 'Demo Company',
  email: ADMIN,
  password: PASSWORD,
});
const firstRun = reg.status === 201;
console.log(firstRun ? 'Created Demo Company' : 'Demo Company already exists');

const token = await login(ADMIN);

for (const user of USERS) {
  const res = await call('POST', `${ORDERHUB}/users`, token, {
    ...user,
    password: PASSWORD,
  });
  console.log(`${user.email}: ${res.status === 201 ? 'created' : 'exists'}`);
}

for (const [product, quantity] of Object.entries(STOCK)) {
  await call('PUT', `${INVENTORY}/stock`, token, { product, quantity });
}
console.log(`Stock set for ${Object.keys(STOCK).length} products`);

// Orders are only added on the first run, so running twice does not double them.
if (firstRun) {
  for (const [customerName, product, quantity] of ORDERS) {
    await call('POST', `${ORDERHUB}/orders`, token, {
      customerName,
      product,
      quantity,
    });
  }
  console.log(`Created ${ORDERS.length} orders`);
}

console.log(`\nLog in at http://localhost:5173 with:`);
console.log(`  ${ADMIN} / ${PASSWORD}  (admin)`);
for (const u of USERS) console.log(`  ${u.email} / ${PASSWORD}  (${u.role})`);
