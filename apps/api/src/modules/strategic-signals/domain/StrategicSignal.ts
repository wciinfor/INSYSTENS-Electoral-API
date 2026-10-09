import { SignalType } from './SignalType';
import { SignalSeverity } from './SignalSeverity';

export interface StrategicSignalMetadata {
  source: string;
  createdAt: string;
  version: string;
  [key: string]: any;
}

export interface StrategicSignal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  confidence: number;
  context: Record<string, unknown>;
  reason: string;
  metadata: StrategicSignalMetadata;
}
