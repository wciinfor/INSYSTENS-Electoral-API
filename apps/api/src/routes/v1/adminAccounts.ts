import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../database/prisma';

export async function adminAccountsRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // 1. Criar nova conta
  fastify.post('/accounts', async (request, reply) => {
    const { name, slug, type, politicalProfile, ssoId } = request.body as any;

    if (!name || !slug || !type) {
      return reply.status(400).send({ error: 'Campos obrigatórios: name, slug, type' });
    }

    try {
      const existing = await prisma.account.findUnique({ where: { slug } });
      if (existing) {
        return reply.status(409).send({ error: 'Já existe uma conta com este slug.' });
      }

      const account = await prisma.account.create({
        data: {
          name,
          slug,
          type,
          ssoId,
          politicalProfile: politicalProfile ? {
            create: {
              candidateName: politicalProfile.candidateName,
              candidateNumber: politicalProfile.candidateNumber,
              role: politicalProfile.role,
              party: politicalProfile.party,
              uf: politicalProfile.uf,
              cityCode: politicalProfile.cityCode,
            }
          } : undefined
        },
        include: {
          politicalProfile: true
        }
      });

      return reply.status(201).send(account);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao criar conta', details: error.message });
    }
  });

  // 2. Listar todas as contas
  fastify.get('/accounts', async (request, reply) => {
    try {
      const accounts = await prisma.account.findMany({
        include: {
          politicalProfile: true,
          electionInterests: true,
          automaticFilters: true
        }
      });
      return accounts;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao buscar contas', details: error.message });
    }
  });

  // 3. Obter detalhes de uma conta específica
  fastify.get('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const account = await prisma.account.findUnique({
        where: { id },
        include: {
          politicalProfile: true,
          electionInterests: true,
          automaticFilters: true,
          apiKeys: {
            select: {
              id: true,
              clientName: true,
              isActive: true,
              createdAt: true
            }
          }
        }
      });

      if (!account) {
        return reply.status(404).send({ error: 'Conta não encontrada.' });
      }
      return account;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao obter conta', details: error.message });
    }
  });

  // 4. Atualizar uma conta
  fastify.put('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, slug, type, isActive, ssoId, politicalProfile } = request.body as any;

    try {
      const existing = await prisma.account.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Conta não encontrada.' });
      }

      const updated = await prisma.account.update({
        where: { id },
        data: {
          name,
          slug,
          type,
          isActive,
          ssoId,
          politicalProfile: politicalProfile ? {
            upsert: {
              create: {
                candidateName: politicalProfile.candidateName,
                candidateNumber: politicalProfile.candidateNumber,
                role: politicalProfile.role,
                party: politicalProfile.party,
                uf: politicalProfile.uf,
                cityCode: politicalProfile.cityCode,
              },
              update: {
                candidateName: politicalProfile.candidateName,
                candidateNumber: politicalProfile.candidateNumber,
                role: politicalProfile.role,
                party: politicalProfile.party,
                uf: politicalProfile.uf,
                cityCode: politicalProfile.cityCode,
              }
            }
          } : undefined
        },
        include: {
          politicalProfile: true
        }
      });

      return updated;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao atualizar conta', details: error.message });
    }
  });

  // 5. Excluir uma conta
  fastify.delete('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const existing = await prisma.account.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Conta não encontrada.' });
      }

      await prisma.account.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao excluir conta', details: error.message });
    }
  });

  // 6. Gerar API Key para uma conta
  fastify.post('/accounts/:id/api-keys', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { clientName } = request.body as { clientName: string };

    if (!clientName) {
      return reply.status(400).send({ error: 'Campo clientName é obrigatório.' });
    }

    try {
      const account = await prisma.account.findUnique({ where: { id } });
      if (!account) {
        return reply.status(404).send({ error: 'Conta não encontrada.' });
      }

      // Gera a chave em texto plano
      const rawKey = `insystens_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const apiKey = await prisma.apiKey.create({
        data: {
          clientName,
          keyHash,
          accountId: id
        }
      });

      return reply.status(201).send({
        id: apiKey.id,
        clientName: apiKey.clientName,
        apiKey: rawKey, // Enviada APENAS uma vez na criação
        message: 'Guarde esta chave em segurança. Ela não será mostrada novamente.'
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao gerar chave de API', details: error.message });
    }
  });
}
