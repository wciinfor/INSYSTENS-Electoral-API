import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { tenantContext } from '../../middlewares/tenantContext';
import { ContextProvider } from '../../core/context/ContextProvider';
import { IntelligenceEngine } from '../../core/intelligence/IntelligenceEngine';
import { KernelPipeline } from '../../core/kernel/KernelPipeline';
import { RepositoryFactory } from '../../core/repositories/RepositoryFactory';

export async function tenantIntelligenceRouter(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Exige o middleware de autenticação e contexto de tenant
  fastify.addHook('preHandler', tenantContext);

  // Endpoint de overview estratégico integrado
  fastify.get('/intelligence/overview', async (request, reply) => {
    try {
      // 1. Resolve o contexto político unificado da conta ativa
      const context = await ContextProvider.resolveFromRequest(request);

      // 2. Executa a análise (mockada de forma realista nesta etapa) baseada no contexto
      const territorialOverview = await IntelligenceEngine.getTerritorialOverview(context);
      const growthOpportunities = await IntelligenceEngine.getGrowthOpportunities(context);
      const strategicSummary = await IntelligenceEngine.getStrategicSummary(context);

      // 3. Retorna a resposta conforme o formato especificado pelo usuário
      return {
        context: {
          accountId: context.accountId,
          accountType: context.accountType,
          politicalProfile: context.politicalProfile,
          defaultElectionInterest: context.defaultElectionInterest,
          automaticFilters: context.automaticFilters,
        },
        territorialOverview,
        growthOpportunities,
        strategicSummary,
      };
    } catch (error: any) {
      fastify.log.error(`Erro ao processar visão geral de inteligência: ${error.message}`);
      return reply.status(500).send({
        error: 'Erro ao gerar visão geral de inteligência',
        details: error.message,
      });
    }
  });

  // Endpoint do Kernel de Inteligência Estratégica (SIK)
  fastify.get('/intelligence/kernel', async (request, reply) => {
    try {
      // 1. Resolve o contexto político unificado
      const context = await ContextProvider.resolveFromRequest(request);

      // 2. Resolve o repositório correto a partir de variável de ambiente (desacoplamento total)
      const provider = process.env.INTELLIGENCE_PROVIDER || 'mock';
      const repository = RepositoryFactory.create(provider);

      // 3. Executa o pipeline analítico do SIK injetando o repositório
      const analysis = await KernelPipeline.run(context, repository);

      // 4. Retorna a análise estendida com os metadados solicitados
      return {
        contextPreview: {
          accountId: context.accountId,
          accountType: context.accountType,
          politicalProfile: context.politicalProfile,
          defaultElectionInterest: context.defaultElectionInterest,
          automaticFilters: context.automaticFilters,
        },
        kernelVersion: analysis.metadata.kernelVersion,
        repositoryVersion: analysis.metadata.repositoryVersion,
        generatedAt: analysis.metadata.generatedAt,
        dataMode: analysis.metadata.dataMode,
        scores: analysis.scores,
        opportunities: analysis.opportunities,
        recommendations: analysis.recommendations,
        alerts: analysis.alerts,
        executiveSummary: analysis.executiveSummary,
        aiContext: analysis.aiContext,
      };
    } catch (error: any) {
      fastify.log.error(`Erro ao executar pipeline do kernel SIK: ${error.message}`);
      return reply.status(500).send({
        error: 'Erro ao processar análise do kernel de inteligência',
        details: error.message,
      });
    }
  });
}
