export interface StrategicAlert {
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'RETENTION' | 'COMPETITION' | 'ABSTENTION' | 'LOGISTICS';
  recommendation: string; // Ação imediata recomendada
  metadata?: Record<string, any>;
}
