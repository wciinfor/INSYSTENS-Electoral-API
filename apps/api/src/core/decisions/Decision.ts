import { DecisionCategory } from './DecisionCategory';
import { DecisionPriority } from './DecisionPriority';
import { DecisionReason } from './DecisionReason';
import { RecommendedAction } from './RecommendedAction';

export interface Decision {
  id: string;
  title: string;
  summary: string;
  category: DecisionCategory;
  priority: DecisionPriority;
  reasons: DecisionReason[];
  recommendedActions: RecommendedAction[];
  expectedImpact: string;
  confidence: number;
  relatedSignals: string[]; // Armazena IDs dos StrategicSignals relacionados
  generatedAt: string;
  metadata?: Record<string, any>;
}
