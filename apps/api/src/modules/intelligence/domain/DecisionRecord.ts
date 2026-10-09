import { DecisionReason } from '../../../core/decisions/DecisionReason';
import { RecommendedAction } from '../../../core/decisions/RecommendedAction';

export interface DecisionRecord {
  tenantId: string;
  id: string;
  category: string;
  priority: string;
  title: string;
  summary: string;
  expectedImpact: string;
  confidence: number;
  reasons: DecisionReason[];
  recommendedActions: RecommendedAction[];
  relatedSignals: string[];
  metadata: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
