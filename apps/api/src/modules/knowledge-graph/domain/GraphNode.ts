import { GraphNodeType } from './GraphNodeType';
import { GraphMetadata } from './GraphMetadata';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  properties: Record<string, unknown>;
  metadata: GraphMetadata;
}
