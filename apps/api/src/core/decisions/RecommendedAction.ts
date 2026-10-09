import { DecisionPriority } from './DecisionPriority';

export interface RecommendedAction {
  title: string;
  description: string;
  priority: DecisionPriority;
  expectedImpact: string;
  estimatedGain: number;
  timeframe: string;
}
