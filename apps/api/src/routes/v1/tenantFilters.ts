import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../../database/prisma';
import { tenantContext } from '../../middlewares/tenantContext';

export async function tenantFiltersRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Registra o middleware de isolamento para todas as rotas deste grupo
  fastify.addHook('preHandler', tenantContext);

  // 1. Listar filtros automáticos do tenant
  fastify.get('/filters', async (request, reply) => {
    const accountId = request.tenantId!;
    try {
      const filters = await prisma.automaticFilter.findMany({
        where: { accountId },
      });
      return filters;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao obter filtros automáticos', details: error.message });
    }
  });

  // 2. Criar novo filtro automático
  fastify.post('/filters', async (request, reply) => {
    const accountId = request.tenantId!;
    const { filterType, field, operator, value } = request.body as any;

    if (!filterType || !field || !operator || value === undefined) {
      return reply.status(400).send({ error: 'Campos filterType, field, operator e value são obrigatórios.' });
    }

    try {
      const filter = await prisma.automaticFilter.create({
        data: {
          accountId,
          filterType,
          field,
          operator,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        },
      });

      return reply.status(201).send(filter);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao criar filtro automático', details: error.message });
    }
  });

  // 3. Remover filtro automático
  fastify.delete('/filters/:id', async (request, reply) => {
    const accountId = request.tenantId!;
    const { id } = request.params as { id: string };

    try {
      const filter = await prisma.automaticFilter.findFirst({
        where: { id, accountId },
      });

      if (!filter) {
        return reply.status(404).send({ error: 'Filtro automático não encontrado ou não pertence a este tenant.' });
      }

      await prisma.automaticFilter.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao excluir filtro automático', details: error.message });
    }
  });
}
