import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'playground-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function main() {
  await producer.connect();

  await producer.send({
    topic: 'test.orders',
    messages: [
      {
        key: 'tenant-1',
        value: JSON.stringify({
          type: 'order.created',
          orderId: 'order-123',
          product: 'Pen',
          quantity: 2,
        }),
      },
    ],
  });

  console.log('Message sent');
  await producer.disconnect();
}

main().catch(console.error);
