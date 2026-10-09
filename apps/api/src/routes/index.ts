import { FastifyInstance } from 'fastify';
import { healthRouter } from './v1/health';
import { adminAccountsRouter } from './v1/adminAccounts';
import { adminImportsRouter } from './v1/adminImports';
import { tenantProfileRouter } from './v1/tenantProfile';
import { tenantFiltersRouter } from './v1/tenantFilters';
import { tenantVotersRouter } from './v1/tenantVoters';
import { tenantIntelligenceRouter } from './v1/tenantIntelligence';

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
    
    // Admin routes
    await v1Instance.register(adminAccountsRouter, { prefix: '/admin' });
    await v1Instance.register(adminImportsRouter, { prefix: '/admin' });
    
    // Tenant routes
    await v1Instance.register(tenantProfileRouter, { prefix: '/tenant' });
    await v1Instance.register(tenantFiltersRouter, { prefix: '/tenant' });
    await v1Instance.register(tenantVotersRouter, { prefix: '/tenant' });
    await v1Instance.register(tenantIntelligenceRouter, { prefix: '/tenant' });
  }, { prefix: '/api/v1' });
}
