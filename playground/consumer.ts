import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'playground-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'playground-group' });

async function main() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'test.orders', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      console.log({
        value: message.value?.toString(),
        partition,
        offset: message.offset,
      });
    },
  });
}

main().catch(console.error);
