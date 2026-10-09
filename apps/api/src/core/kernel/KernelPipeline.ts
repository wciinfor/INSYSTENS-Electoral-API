import { PoliticalIntelligenceContext, KernelAnalysisResult, RecommendationResult, AlertResult, KERNEL_VERSION, REPOSITORY_VERSION } from './types';
import { ScoreRegistry } from './ScoreRegistry';
import { ExecutiveSummaryBuilder } from './ExecutiveSummaryBuilder';
import { AIContextBuilder } from './AIContextBuilder';
import { IntelligenceRepository } from '../repositories/interfaces/IntelligenceRepository';

export class KernelPipeline {
  /**
   * Executa a análise completa do SIK a partir do contexto pré-resolvido
   * e da abstração de dados provida pelo IntelligenceRepository.
   * O pipeline é agnóstico em relação à fonte real dos dados.
   */
  static async run(
    context: PoliticalIntelligenceContext,
    repository: IntelligenceRepository
  ): Promise<KernelAnalysisResult> {
    const accountId = context.accountId;

    // 1. Carrega dados analíticos e demográficos de forma assíncrona usando o Repositório
    const territorialOverview = await repository.getTerritorialOverview(accountId);
    const growthIndicators = await repository.getGrowthIndicators(accountId);
    const opportunities = await repository.getStrategicOpportunities(accountId);
    const politicalPresence = await repository.getPoliticalPresence(accountId);
    const executiveIndicators = await repository.getExecutiveIndicators(accountId);

    // 2. Executa todos os scores registrados usando o contexto básico
    const scores = ScoreRegistry.executeAll(context);

    // 3. Ajusta dinamicamente as pontuações e métricas do SIK com base no repositório ativo
    const scoresWithRepo = scores.map(s => {
      if (s.code === 'TCS' && executiveIndicators.tcsScore !== undefined) {
        s.score = executiveIndicators.tcsScore;
        s.level = executiveIndicators.tcsScore < 20 ? 'VERY_LOW' : 
                  executiveIndicators.tcsScore < 40 ? 'LOW' :
                  executiveIndicators.tcsScore < 60 ? 'MEDIUM' :
                  executiveIndicators.tcsScore < 80 ? 'HIGH' : 'VERY_HIGH';
      }
      if (s.code === 'GOS' && executiveIndicators.gosScore !== undefined) {
        s.score = executiveIndicators.gosScore;
        s.level = executiveIndicators.gosScore < 20 ? 'VERY_LOW' : 
                  executiveIndicators.gosScore < 40 ? 'LOW' :
                  executiveIndicators.gosScore < 60 ? 'MEDIUM' :
                  executiveIndicators.gosScore < 80 ? 'HIGH' : 'VERY_HIGH';
      }
      if (s.code === 'PRS' && executiveIndicators.prsScore !== undefined) {
        s.score = executiveIndicators.prsScore;
        s.level = executiveIndicators.prsScore < 20 ? 'VERY_LOW' : 
                  executiveIndicators.prsScore < 40 ? 'LOW' :
                  executiveIndicators.prsScore < 60 ? 'MEDIUM' :
                  executiveIndicators.prsScore < 80 ? 'HIGH' : 'VERY_HIGH';
      }
      if (s.code === 'ISI' && executiveIndicators.isiScore !== undefined) {
        s.score = executiveIndicators.isiScore;
        s.level = executiveIndicators.isiScore < 200 ? 'VERY_LOW' : 
                  executiveIndicators.isiScore < 400 ? 'LOW' :
                  executiveIndicators.isiScore < 600 ? 'MEDIUM' :
                  executiveIndicators.isiScore < 800 ? 'HIGH' : 'VERY_HIGH';
      }
      return s;
    });

    // 4. Constrói recomendações acoplando informações do repositório
    const recommendations: RecommendationResult[] = [
      {
        title: 'Campanha de expansão territorial em áreas de oportunidade',
        description: 'Priorizar agendas presenciais e panfletagem nas zonas onde o GOS ultrapassa 70%.',
        priority: 'HIGH',
        category: 'TERRITORIAL',
      },
      {
        title: 'Fortalecer recrutamento de novas lideranças',
        description: `Expandir a capilaridade da campanha. Líderes atuais na base: ${politicalPresence.totalLeaders || 0}.`,
        priority: 'MEDIUM',
        category: 'ORGANIZATION',
      }
    ];

    // 5. Constrói alertas baseados no repositório
    const alerts: AlertResult[] = [
      {
        title: 'Taxa de cobertura do eleitorado',
        description: `Eleitores monitorados equivalem a uma cobertura estimada de ${((territorialOverview.coveragePercentage || 0) * 100).toFixed(2)}% na região de atuação.`,
        severity: 'WARNING',
      }
    ];

    // 6. Constrói sumário executivo e carga de payload da IA
    const executiveSummary = ExecutiveSummaryBuilder.build(context, scoresWithRepo);
    const aiContext = AIContextBuilder.build(context, scoresWithRepo);

    // Acopla os dados analíticos dinâmicos no contexto da IA
    aiContext.voterEngagementProfile = {
      totalRegisteredVoters: politicalPresence.registeredVotersCount || 0,
      activityLevel: politicalPresence.activityLevel || 'MEDIUM'
    };

    if (growthIndicators.strengthAreas) {
      aiContext.strengthAreas = Array.from(new Set([...aiContext.strengthAreas, ...growthIndicators.strengthAreas]));
    }
    if (growthIndicators.weaknessAreas) {
      aiContext.weaknessAreas = Array.from(new Set([...aiContext.weaknessAreas, ...growthIndicators.weaknessAreas]));
    }

    return {
      scores: scoresWithRepo,
      opportunities,
      recommendations,
      alerts,
      executiveSummary,
      aiContext,
      metadata: {
        kernelVersion: KERNEL_VERSION,
        repositoryVersion: REPOSITORY_VERSION,
        generatedAt: new Date().toISOString(),
        accountId,
        dataMode: repository.getDataMode(),
      },
    };
  }
}
