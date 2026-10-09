import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../../database/prisma';
import { tenantContext } from '../../middlewares/tenantContext';

export async function tenantVotersRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Registra o middleware de isolamento para todas as rotas deste grupo
  fastify.addHook('preHandler', tenantContext);

  // 1. Listar eleitores com isolamento e filtros automáticos
  fastify.get('/registered-voters', async (request, reply) => {
    const tenantId = request.tenantId!;

    try {
      // Começamos com a query base isolada por tenantId
      const whereClause: any = {
        tenantId,
      };

      // Buscar os filtros automáticos ativos para esta conta
      const autoFilters = await prisma.automaticFilter.findMany({
        where: { accountId: tenantId },
      });

      // Aplicar filtros dinamicamente na query do banco
      for (const filter of autoFilters) {
        let parsedValue: any = filter.value;
        try {
          // Tenta parsear caso seja um array ou objeto JSON (como arrays para operador IN)
          parsedValue = JSON.parse(filter.value);
        } catch {
          // Mantém string simples se falhar
        }

        // Mapear campos suportados no modelo RegisteredVoter
        const allowedFields = ['uf', 'cityCode', 'zoneNumber', 'sectionNumber', 'neighborhood'];
        if (!allowedFields.includes(filter.field)) {
          continue; // Pula campos não pertencentes ao modelo
        }

        // Converter valores numéricos se necessário
        if (['cityCode', 'zoneNumber', 'sectionNumber'].includes(filter.field)) {
          if (Array.isArray(parsedValue)) {
            parsedValue = parsedValue.map(v => Number(v));
          } else if (parsedValue !== null && parsedValue !== undefined) {
            parsedValue = Number(parsedValue);
          }
        }

        // Montar a query condicional baseada no operador
        switch (filter.operator) {
          case 'EQUALS':
            whereClause[filter.field] = parsedValue;
            break;
          case 'IN':
            whereClause[filter.field] = {
              in: Array.isArray(parsedValue) ? parsedValue : [parsedValue],
            };
            break;
          case 'CONTAINS':
            whereClause[filter.field] = {
              contains: String(parsedValue),
              mode: 'insensitive',
            };
            break;
          default:
            whereClause[filter.field] = parsedValue;
            break;
        }
      }

      // Executa a busca com todos os filtros aplicados transparentemente
      const voters = await prisma.registeredVoter.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
      });

      return {
        voters,
        appliedFiltersCount: autoFilters.length,
      };
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao buscar eleitores', details: error.message });
    }
  });

  // 2. Criar novo eleitor associado ao tenant
  fastify.post('/registered-voters', async (request, reply) => {
    const tenantId = request.tenantId!;
    const { name, document, phone, email, uf, cityCode, zoneNumber, sectionNumber, address, neighborhood, latitude, longitude, leaderId } = request.body as any;

    if (!name || !uf || !cityCode) {
      return reply.status(400).send({ error: 'Campos obrigatórios: name, uf, cityCode' });
    }

    try {
      const voter = await prisma.registeredVoter.create({
        data: {
          tenantId, // Forçado pelo contexto da requisição
          name,
          document,
          phone,
          email,
          uf,
          cityCode: Number(cityCode),
          zoneNumber: zoneNumber ? Number(zoneNumber) : null,
          sectionNumber: sectionNumber ? Number(sectionNumber) : null,
          address,
          neighborhood,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          leaderId,
        },
      });

      return reply.status(201).send(voter);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao criar eleitor', details: error.message });
    }
  });
}
