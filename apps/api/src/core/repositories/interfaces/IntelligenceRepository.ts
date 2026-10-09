export interface IntelligenceRepository {
  getDataMode(): string;
  getPoliticalProfile(accountId: string): Promise<any>;
  getTerritorialOverview(accountId: string): Promise<any>;
  getMunicipalityRanking(accountId: string): Promise<any>;
  getGrowthIndicators(accountId: string): Promise<any>;
  getStrategicOpportunities(accountId: string): Promise<any>;
  getPoliticalPresence(accountId: string): Promise<any>;
  getExecutiveIndicators(accountId: string): Promise<any>;
}
