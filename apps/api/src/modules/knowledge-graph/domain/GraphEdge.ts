import { GraphRelationType } from './GraphRelationType';
import { GraphMetadata } from './GraphMetadata';

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: GraphRelationType;
  weight: number;
  metadata: GraphMetadata;
}
