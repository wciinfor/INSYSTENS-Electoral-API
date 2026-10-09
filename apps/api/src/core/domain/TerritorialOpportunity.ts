export interface TerritorialOpportunity {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIVE';
  confidence: number; // 0.0 a 1.0
  recommendedActions: string[];
  metadata?: Record<string, any>;
}
