import { SignalCategory } from './SignalCategory';
import { SignalStatus } from './SignalStatus';
import { SignalPriority } from './SignalPriority';
import { SignalTrend } from './SignalTrend';
import { SignalExplanation } from './SignalExplanation';
import { SignalAction } from './SignalAction';

export interface StrategicSignal {
  id: string;
  code: string;
  title: string;
  category: SignalCategory;
  status: SignalStatus;
  priority: SignalPriority;
  trend: SignalTrend;
  confidence: number; // 0.0 a 1.0
  score: number;
  summary: string;
  explanation: SignalExplanation;
  recommendedActions: SignalAction[];
  relatedFactors: string[];
  algorithm: string;
  algorithmVersion: string;
  generatedAt: string;
  metadata?: Record<string, any>;
}
