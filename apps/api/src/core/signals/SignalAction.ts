export interface SignalAction {
  title: string;
  description: string;
  expectedImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'TRANSFORMATIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedGain: number; // ganho de votos estimado
}
