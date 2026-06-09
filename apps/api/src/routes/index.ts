import { FastifyInstance } from 'fastify';
import { healthRouter } from './v1/health';

export async function registerRoutes(fastify: FastifyInstance) {
  // Global /health route
  fastify.get('/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Prefix routes under /api/v1
  await fastify.register(async (v1Instance) => {
    await v1Instance.register(healthRouter);
  }, { prefix: '/api/v1' });
}
