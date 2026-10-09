export interface CampaignScenario {
  scenarioName: string;
  probability: number; // 0.0 a 1.0
  growthProjection: number; // projeção de crescimento de votos
  riskProjection: number; // risco de perda de votos estimado
  recommendedStrategy: string;
  metadata?: Record<string, any>;
}
