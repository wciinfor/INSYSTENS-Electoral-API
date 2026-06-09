import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../../database/prisma';

export async function healthRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  fastify.get('/health/db', async (request, reply) => {
    const start = performance.now();
    try {
      // Executa consulta simples de ping no banco
      await prisma.$queryRaw`SELECT 1`;
      const durationMs = parseFloat((performance.now() - start).toFixed(2));

      return reply.status(200).send({
        status: 'OK',
        database: {
          status: 'CONNECTED',
          latencyMs: durationMs
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2));
      fastify.log.error(`Erro ao conectar ao banco de dados: ${error.message}`);

      return reply.status(503).send({
        status: 'ERROR',
        database: {
          status: 'DISCONNECTED',
          error: error.message || 'Erro de conexão',
          latencyMs: durationMs
        },
        timestamp: new Date().toISOString()
      });
    }
  });
}

