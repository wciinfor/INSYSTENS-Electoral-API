import { GraphNode } from '../../knowledge-graph/domain/GraphNode';
import { GraphEdge } from '../../knowledge-graph/domain/GraphEdge';
import { StrategicSignal } from './StrategicSignal';

export interface SignalRule {
  id: string;
  name: string;
  priority: number;
  evaluate(nodes: GraphNode[], edges: GraphEdge[]): Promise<StrategicSignal[]>;
}
