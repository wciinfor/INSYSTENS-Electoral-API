import { IntelligenceRepository } from '../interfaces/IntelligenceRepository';
import { RepositoryRegistry } from '../RepositoryRegistry';
import { prisma } from '../../../database/prisma';

export class PrismaIntelligenceRepository implements IntelligenceRepository {
  getDataMode(): string {
    return 'PRISMA';
  }

  async getPoliticalProfile(accountId: string): Promise<any> {
    const profile = await prisma.politicalProfile.findUnique({
      where: { accountId }
    });

    if (profile) {
      return {
        accountId: profile.accountId,
        candidateName: profile.candidateName,
        candidateNumber: profile.candidateNumber,
        role: profile.role,
        party: profile.party,
        uf: profile.uf,
        cityCode: profile.cityCode,
      };
    }

    // Fallback se perfil não cadastrado
    return {
      accountId,
      candidateName: 'Político Sem Perfil',
      candidateNumber: '00000',
      role: 'DEPUTADO_FEDERAL',
      party: 'PSD',
      uf: 'SP',
      cityCode: null,
    };
  }

  async getTerritorialOverview(accountId: string): Promise<any> {
    // Busca informações agregadas no banco da base de eleitores reais
    const registeredVotersCount = await prisma.registeredVoter.count({
      where: { tenantId: accountId }
    });

    return {
      totalVoters: 15300000, // Dado geográfico mockado
      monitoredSections: 1420, // Dado geográfico mockado
      coveragePercentage: registeredVotersCount > 0 ? parseFloat((registeredVotersCount / 100000).toFixed(4)) : 0.01,
    };
  }

  async getMunicipalityRanking(accountId: string): Promise<any> {
    // Como os dados oficiais de voto do TSE ainda não existem, retornamos estrutura mock realista
    return [
      { cityCode: 3550308, cityName: 'São Paulo', rank: 1, votesEstimation: 45000 },
      { cityCode: 3509502, cityName: 'Campinas', rank: 2, votesEstimation: 12500 },
      { cityCode: 3548500, cityName: 'Santos', rank: 3, votesEstimation: 8200 }
    ];
  }

  async getGrowthIndicators(accountId: string): Promise<any> {
    // Carrega filtros cadastrados para deduzir pontos de atenção
    const filters = await prisma.automaticFilter.findMany({
      where: { accountId }
    });

    const activeUfs = filters
      .filter(f => f.filterType === 'GEOGRAPHIC' && f.field === 'uf')
      .map(f => f.value);

    return {
      strengthAreas: [
        `Filtros geográficos ativos para: ${activeUfs.length > 0 ? activeUfs.join(', ') : 'Nenhum'}`,
        'Base territorial consolidada na capital'
      ],
      weaknessAreas: [
        'Ameaça de sobreposição de concorrência nas zonas periféricas',
        'Taxa histórica de abstenção moderada na região'
      ]
    };
  }

  async getStrategicOpportunities(accountId: string): Promise<any> {
    return [
      {
        id: 'opt-001',
        location: 'Zona 123 - Centro, SP',
        priorityScore: 88.5,
        targetAudienceSize: 12500,
        rationale: 'Região central com alta densidade e baixos registros.',
      },
      {
        id: 'opt-002',
        location: 'Zona 342 - Vila Nova, SP',
        priorityScore: 75.2,
        targetAudienceSize: 8400,
        rationale: 'Presença ativa do partido, mas baixo engajamento nominal.',
      }
    ];
  }

  async getPoliticalPresence(accountId: string): Promise<any> {
    const totalLeaders = await prisma.leader.count({
      where: { tenantId: accountId }
    });

    const registeredVotersCount = await prisma.registeredVoter.count({
      where: { tenantId: accountId }
    });

    return {
      totalLeaders,
      registeredVotersCount,
      activityLevel: totalLeaders > 5 ? 'HIGH' : 'MEDIUM',
    };
  }

  async getExecutiveIndicators(accountId: string): Promise<any> {
    // Retorna os indicadores com base nas configurações e na quantidade de eleitores
    const voters = await prisma.registeredVoter.count({
      where: { tenantId: accountId }
    });

    // Se o cliente tem mais eleitores cadastrados, o TCS score aumenta
    const computedTcs = Math.min(60 + voters * 2, 98);

    return {
      isiScore: Math.round(computedTcs * 10),
      tcsScore: computedTcs,
      gosScore: 78,
      prsScore: 32,
    };
  }
}

// Auto-registro da classe no registro global
RepositoryRegistry.register('prisma', PrismaIntelligenceRepository);
