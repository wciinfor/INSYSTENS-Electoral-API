export interface MunicipalityPerformance {
  municipalityCode: number;
  municipalityName: string;
  uf: string;
  estimatedElectors: number;
  territorialStrength: number; // 0.0 a 100.0
  growthPotential: number; // 0.0 a 100.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  strategicClassification: 'RETENTION' | 'EXPANSION' | 'MONITORING' | 'ABANDON';
  metadata?: Record<string, any>;
}
