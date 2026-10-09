import { IntelligenceRepository } from '../interfaces/IntelligenceRepository';
import { RepositoryRegistry } from '../RepositoryRegistry';

export class MockIntelligenceRepository implements IntelligenceRepository {
  getDataMode(): string {
    return 'MOCK';
  }

  async getPoliticalProfile(accountId: string): Promise<any> {
    return {
      accountId,
      candidateName: 'Candidato Amostra',
      candidateNumber: '12345',
      role: 'DEPUTADO_ESTADUAL',
      party: 'MDB',
      uf: 'SP',
      cityCode: null,
    };
  }

  async getTerritorialOverview(accountId: string): Promise<any> {
    return {
      totalVoters: 15300000,
      monitoredSections: 1420,
      coveragePercentage: 0.82,
    };
  }

  async getMunicipalityRanking(accountId: string): Promise<any> {
    return [
      { cityCode: 3550308, cityName: 'São Paulo', rank: 1, votesEstimation: 45000 },
      { cityCode: 3509502, cityName: 'Campinas', rank: 2, votesEstimation: 12500 },
      { cityCode: 3548500, cityName: 'Santos', rank: 3, votesEstimation: 8200 }
    ];
  }

  async getGrowthIndicators(accountId: string): Promise<any> {
    return {
      strengthAreas: ['Forte capilaridade de líderes locais', 'Base territorial consolidada na capital'],
      weaknessAreas: ['Ameaça de sobreposição de concorrência nas zonas periféricas', 'Taxa histórica de abstenção moderada na região']
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
    return {
      totalLeaders: 45,
      registeredVotersCount: 3500,
      activityLevel: 'HIGH',
    };
  }

  async getExecutiveIndicators(accountId: string): Promise<any> {
    return {
      isiScore: 720,
      tcsScore: 65,
      gosScore: 78,
      prsScore: 32,
    };
  }
}

// Auto-registro da classe no registro global
RepositoryRegistry.register('mock', MockIntelligenceRepository);
