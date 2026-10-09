import { PrismaClient } from '@prisma/client';
import { IntelligenceRepository } from '../../../core/repositories/interfaces/IntelligenceRepository';

export interface GraphIntelligenceRepositoryOptions {
  tenantId: string;
  prisma?: PrismaClient;
}

export class GraphIntelligenceRepository implements IntelligenceRepository {
  private tenantId: string;
  private prisma: PrismaClient;

  constructor(options: GraphIntelligenceRepositoryOptions) {
    if (!options || !options.tenantId) {
      throw new Error('GraphIntelligenceRepository: tenantId é obrigatório.');
    }
    this.tenantId = options.tenantId;
    this.prisma = options.prisma || new PrismaClient();
  }

  getDataMode(): string {
    return 'GRAPH_STRATEGIC';
  }

  /**
   * Obtém o perfil político correspondente EXATAMENTE ao accountId informado.
   * Regra estrita de semântica:
   * accountId informado
   * -> procurar exatamente o nó candidate correspondente no tenant
   * -> encontrado: retornar perfil
   * -> não encontrado: retornar null (PROIBIDO qualquer fallback silencioso para outro candidato)
   */
  async getPoliticalProfile(accountId: string): Promise<any> {
    if (!accountId) {
      return null;
    }

    const specificCandidate = await this.prisma.graphNodeRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id: accountId,
        },
      },
    });

    if (specificCandidate && specificCandidate.type === 'candidate') {
      const props = (specificCandidate.properties as Record<string, any>) || {};
      return {
        accountId: specificCandidate.id,
        candidateName: props.nome || props.name || specificCandidate.id,
        candidateNumber: props.numero ? String(props.numero) : props.number || '00000',
        role: props.cargo || props.role || 'DEPUTADO_FEDERAL',
        party: props.partido || props.party || 'INDEPENDENTE',
        uf: props.uf || 'SP',
        cityCode: props.cityCode || null,
      };
    }

    return null;
  }

  /**
   * Visão territorial tenant-wide baseada estritamente em nós e arestas existentes no grafo.
   * Não inventa eleitores totais ou seções fictícias se não existirem no repositório.
   */
  async getTerritorialOverview(accountId: string): Promise<any> {
    const municipalityCount = await this.prisma.graphNodeRecord.count({
      where: {
        tenantId: this.tenantId,
        type: 'municipality',
      },
    });

    const candidateCount = await this.prisma.graphNodeRecord.count({
      where: {
        tenantId: this.tenantId,
        type: 'candidate',
      },
    });

    const edgeCount = await this.prisma.graphEdgeRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });

    return {
      municipalityCount,
      candidateCount,
      edgeCount,
      totalVoters: 0,
      monitoredSections: 0,
      coveragePercentage: 0,
    };
  }

  /**
   * Ranking de municípios baseado nos nós de tipo 'municipality' realmente persistidos.
   */
  async getMunicipalityRanking(accountId: string): Promise<any> {
    const munNodes = await this.prisma.graphNodeRecord.findMany({
      where: {
        tenantId: this.tenantId,
        type: 'municipality',
      },
      take: 10,
    });

    return munNodes.map((node, index) => {
      const props = (node.properties as Record<string, any>) || {};
      return {
        cityCode: props.codigo || props.cityCode || props.code || null,
        cityName: props.nome || props.cityName || props.name || node.id,
        rank: index + 1,
        votesEstimation: props.votosEstimados || props.votes || 0,
      };
    });
  }

  /**
   * Indicadores de crescimento baseados exclusivamente em fatos topológicos e sinais reais.
   */
  async getGrowthIndicators(accountId: string): Promise<any> {
    const edgeCount = await this.prisma.graphEdgeRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });

    const orphanSignalCount = await this.prisma.strategicSignalRecord.count({
      where: {
        tenantId: this.tenantId,
        type: 'orphan_node',
      },
    });

    const opportunitySignalCount = await this.prisma.strategicSignalRecord.count({
      where: {
        tenantId: this.tenantId,
        type: 'territorial_opportunity',
      },
    });

    const strengthAreas: string[] = [];
    const weaknessAreas: string[] = [];

    if (edgeCount > 0) {
      strengthAreas.push(`Rede relacional com ${edgeCount} arestas mapeadas.`);
    }
    if (opportunitySignalCount > 0) {
      strengthAreas.push(`${opportunitySignalCount} sinais de oportunidade territorial detectados.`);
    }
    if (orphanSignalCount > 0) {
      weaknessAreas.push(`${orphanSignalCount} nós órfãos identificados na rede.`);
    }

    return {
      strengthAreas,
      weaknessAreas,
      edgeCount,
      orphanSignalCount,
      opportunitySignalCount,
    };
  }

  /**
   * Oportunidades estratégicas transportadas diretamente dos StrategicSignalRecord persistidos.
   * Não inventa score arbitrário (como 90/75/50) nem público fictício.
   * Transporta estritamente os atributos reais do sinal do domínio.
   */
  async getStrategicOpportunities(accountId: string): Promise<any> {
    const signalRecords = await this.prisma.strategicSignalRecord.findMany({
      where: {
        tenantId: this.tenantId,
      },
      take: 5,
    });

    return signalRecords.map((sig) => {
      const ctx = (sig.context as Record<string, any>) || {};
      return {
        id: sig.id,
        location: ctx.municipalityId || ctx.nodeId || 'N/A',
        severity: sig.severity,
        confidence: sig.confidence,
        type: sig.type,
        context: ctx,
        rationale: sig.reason,
      };
    });
  }

  /**
   * Presença política extraída da contagem real de nós de candidatos e partidos no tenant.
   * Não inventa classificações arbitrárias de activityLevel sem regra de domínio.
   */
  async getPoliticalPresence(accountId: string): Promise<any> {
    const candidateNodes = await this.prisma.graphNodeRecord.count({
      where: {
        tenantId: this.tenantId,
        type: 'candidate',
      },
    });

    const partyNodes = await this.prisma.graphNodeRecord.count({
      where: {
        tenantId: this.tenantId,
        type: 'party',
      },
    });

    const totalEdges = await this.prisma.graphEdgeRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });

    return {
      totalLeaders: candidateNodes + partyNodes,
      registeredVotersCount: 0,
      totalEdges,
    };
  }

  /**
   * Indicadores executivos para o KernelPipeline.
   * O adapter NÃO recalcula nem simula fórmulas do SIK (TCS/GOS/PRS/ISI).
   */
  async getExecutiveIndicators(accountId: string): Promise<any> {
    return {};
  }
}
