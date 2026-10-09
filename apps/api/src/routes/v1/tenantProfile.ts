import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../../database/prisma';
import { tenantContext } from '../../middlewares/tenantContext';

export async function tenantProfileRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Registra o middleware de isolamento para todas as rotas deste grupo
  fastify.addHook('preHandler', tenantContext);

  // 1. Obter perfil político do tenant
  fastify.get('/profile', async (request, reply) => {
    const accountId = request.tenantId!;
    try {
      const profile = await prisma.politicalProfile.findUnique({
        where: { accountId },
      });

      if (!profile) {
        return reply.status(404).send({ error: 'Perfil político não configurado para este tenant.' });
      }

      return profile;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao obter perfil político', details: error.message });
    }
  });

  // 2. Criar ou atualizar perfil político
  fastify.put('/profile', async (request, reply) => {
    const accountId = request.tenantId!;
    const { candidateName, candidateNumber, role, party, uf, cityCode, candidateId } = request.body as any;

    try {
      const profile = await prisma.politicalProfile.upsert({
        where: { accountId },
        update: {
          candidateName,
          candidateNumber,
          role,
          party,
          uf,
          cityCode,
          candidateId,
        },
        create: {
          accountId,
          candidateName,
          candidateNumber,
          role,
          party,
          uf,
          cityCode,
          candidateId,
        },
      });

      return profile;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao atualizar perfil político', details: error.message });
    }
  });

  // 3. Listar eleições de interesse
  fastify.get('/interests', async (request, reply) => {
    const accountId = request.tenantId!;
    try {
      const interests = await prisma.electionInterest.findMany({
        where: { accountId },
      });
      return interests;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao obter eleições de interesse', details: error.message });
    }
  });

  // 4. Adicionar eleição de interesse
  fastify.post('/interests', async (request, reply) => {
    const accountId = request.tenantId!;
    const { year, round, type, electionId } = request.body as any;

    if (!year || !round || !type) {
      return reply.status(400).send({ error: 'Campos year, round e type são obrigatórios.' });
    }

    try {
      const interest = await prisma.electionInterest.create({
        data: {
          accountId,
          electionId,
          year,
          round,
          type,
        },
      });

      return reply.status(201).send(interest);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao adicionar eleição de interesse', details: error.message });
    }
  });

  // 5. Remover eleição de interesse
  fastify.delete('/interests/:id', async (request, reply) => {
    const accountId = request.tenantId!;
    const { id } = request.params as { id: string };

    try {
      const interest = await prisma.electionInterest.findFirst({
        where: { id, accountId },
      });

      if (!interest) {
        return reply.status(404).send({ error: 'Eleição de interesse não encontrada ou não pertence a este tenant.' });
      }

      await prisma.electionInterest.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao excluir eleição de interesse', details: error.message });
    }
  });
}
