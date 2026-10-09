import { ElectoralContext } from '../context/ContextProvider';

export interface TerritorialOverview {
  regionName: string;
  totalVoters: number;
  monitoredSections: number;
  totalLeaders: number;
  registeredVotersCount: number;
  coveragePercentage: number;
}

export interface GrowthOpportunity {
  id: string;
  location: string;
  priorityScore: number; // 0 a 100
  targetAudienceSize: number;
  rationale: string;
}

export interface StrategicSummary {
  executiveSummary: string;
  topPriorityAction: string;
  alerts: string[];
  recommendations: string[];
}

export class IntelligenceEngine {
  /**
   * Obtém a visão geral territorial com dados geográficos baseados no contexto
   */
  static async getTerritorialOverview(context: ElectoralContext): Promise<TerritorialOverview> {
    const uf = context.geographicContext.uf || 'Brasil';
    const city = context.geographicContext.cityCode ? `Município ${context.geographicContext.cityCode}` : '';
    const regionName = city ? `${city} - ${uf}` : uf;

    // Retorna mock estruturado e realista para ser substituído por agregação real
    return {
      regionName,
      totalVoters: context.geographicContext.cityCode ? 425000 : 15300000,
      monitoredSections: 1420,
      totalLeaders: 45,
      registeredVotersCount: 3500,
      coveragePercentage: 0.82,
    };
  }

  /**
   * Identifica oportunidades de crescimento eleitoral com base nas seções de pior/melhor desempenho
   */
  static async getGrowthOpportunities(context: ElectoralContext): Promise<GrowthOpportunity[]> {
    const uf = context.geographicContext.uf || 'SP';

    // Mock realista de priorização baseado no perfil da candidatura
    return [
      {
        id: 'opt-001',
        location: `Zona 123 - Centro, ${uf}`,
        priorityScore: 88.5,
        targetAudienceSize: 12500,
        rationale: 'Zona com alta densidade demográfica e baixo percentual de eleitores cadastrados na base de lideranças.',
      },
      {
        id: 'opt-002',
        location: `Zona 342 - Vila Nova, ${uf}`,
        priorityScore: 75.2,
        targetAudienceSize: 8400,
        rationale: 'Desempenho histórico do partido médio na região, sugerindo alta margem para conversão com visitas focadas.',
      },
      {
        id: 'opt-003',
        location: `Zona 012 - Jardim América, ${uf}`,
        priorityScore: 61.0,
        targetAudienceSize: 15300,
        rationale: 'Forte presença de eleitores jovens e alta abstenção na última eleição. Foco em engajamento digital.',
      }
    ];
  }

  /**
   * Gera um resumo estratégico consolidado
   */
  static async getStrategicSummary(context: ElectoralContext): Promise<StrategicSummary> {
    const candidateName = context.candidateContext.candidateName || 'o Candidato';
    const role = context.candidateContext.role || 'Parlamentar';
    const party = context.candidateContext.party || 'Partido';

    return {
      executiveSummary: `Análise estratégica gerada para o perfil de ${candidateName} disputando cargo de ${role} pelo ${party}. O foco atual de engajamento territorial prioriza áreas de alta representatividade no estado de ${context.geographicContext.uf || 'SP'}.`,
      topPriorityAction: 'Mobilizar lideranças nas Zonas 123 e 342 para campanha porta a porta nos próximos 15 dias.',
      alerts: [
        'A cobertura de eleitores cadastrados na base do MandatoPro está abaixo de 1% nas regiões periféricas.',
        'A ausência de eleições de interesse municipal configuradas para 2024 limita análises históricas locais.'
      ],
      recommendations: [
        'Cadastrar novos líderes comunitários focados na zona norte para balancear a influência geográfica.',
        'Vincular o perfil político oficial aos dados consolidados de votação da última eleição assim que importados.'
      ]
    };
  }
}
