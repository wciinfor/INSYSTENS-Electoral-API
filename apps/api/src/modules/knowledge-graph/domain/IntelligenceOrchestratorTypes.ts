import { MappedRecord } from '../../data-platform/domain/MappedRecord';
import { RepositoryRecord } from '../../strategic-repository/domain/RepositoryRecord';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { StrategicSignal } from '../../strategic-signals/domain/StrategicSignal';

export interface OrchestratorContext {
  mappedRecord: MappedRecord;
  targetRepositoryId?: string;
  metadata?: Record<string, unknown>;
}

export interface IntelligenceOrchestrationResult {
  repositoryRecord: RepositoryRecord;
  graphNode: GraphNode;
  edgesCreated: GraphEdge[];
  signalsGenerated: StrategicSignal[];
  elapsedTime: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}
