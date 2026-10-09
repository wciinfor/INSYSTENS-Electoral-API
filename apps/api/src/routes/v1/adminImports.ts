import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../../database/prisma';

export async function adminImportsRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // 1. Simular início de uma importação do TSE
  fastify.post('/imports', async (request, reply) => {
    const { filename, fileType } = request.body as { filename: string; fileType: string };

    if (!filename || !fileType) {
      return reply.status(400).send({ error: 'Campos filename e fileType são obrigatórios.' });
    }

    try {
      const job = await prisma.importJob.create({
        data: {
          status: 'PENDING',
          filename,
          fileType,
          totalRecords: 0,
          processedRecords: 0,
        }
      });

      // Simular processamento assíncrono (apenas atualiza o status após alguns segundos)
      setTimeout(async () => {
        try {
          await prisma.importJob.update({
            where: { id: job.id },
            data: {
              status: 'PROCESSING',
              totalRecords: 150000,
            }
          });

          // Concluir simulando sucesso
          setTimeout(async () => {
            await prisma.importJob.update({
              where: { id: job.id },
              data: {
                status: 'COMPLETED',
                processedRecords: 150000,
              }
            });
          }, 5000);

        } catch (err) {
          console.error('Erro na simulação do job de importação:', err);
        }
      }, 2000);

      return reply.status(202).send({
        message: 'Job de importação simulado e iniciado em segundo plano.',
        job
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao criar job de importação', details: error.message });
    }
  });

  // 2. Listar jobs de importação
  fastify.get('/imports', async (request, reply) => {
    try {
      const jobs = await prisma.importJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      return jobs;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao buscar jobs de importação', details: error.message });
    }
  });

  // 3. Status de um job específico
  fastify.get('/imports/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const job = await prisma.importJob.findUnique({
        where: { id },
        include: { errors: true }
      });

      if (!job) {
        return reply.status(404).send({ error: 'Job não encontrado.' });
      }

      return job;
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao obter status do job', details: error.message });
    }
  });
}
