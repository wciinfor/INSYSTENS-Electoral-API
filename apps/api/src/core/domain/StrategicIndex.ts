export interface StrategicIndex {
  score: number; // 0 a 1000
  level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  confidence: number; // 0.0 a 1.0
  algorithmVersion: string;
  generatedAt: string;
  metadata?: Record<string, any>;
}
