export interface StrategicRecommendation {
  title: string;
  description: string;
  category: 'TERRITORIAL' | 'COMMUNICATION' | 'ORGANIZATION' | 'DIGITAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  confidence: number; // 0.0 a 1.0
  estimatedGain: number; // ganho de votos estimado
  metadata?: Record<string, any>;
}
