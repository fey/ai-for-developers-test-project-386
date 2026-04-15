import Fastify from 'fastify';

import app from './app.js';

const start = async (): Promise<void> => {
  const server = Fastify({ logger: true });
  await server.register(app);

  const port = Number.parseInt(process.env.PORT ?? '8080', 10);
  await server.listen({ port, host: '0.0.0.0' });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
