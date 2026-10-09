import { GraphNode } from './GraphNode';
import { RelationshipResult } from './RelationshipResult';

export interface RelationshipRule {
  id: string;
  name: string;
  priority: number;
  evaluate(sourceNode: GraphNode, targetNode: GraphNode): Promise<RelationshipResult>;
}
