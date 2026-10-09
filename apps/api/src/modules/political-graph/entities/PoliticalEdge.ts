import { IPoliticalEdge, PoliticalEdgeType } from '../types/GraphTypes';

export class PoliticalEdge implements IPoliticalEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: PoliticalEdgeType;
  weight?: number;
  confidence?: number;
  metadata: Record<string, any>;

  constructor(data: IPoliticalEdge) {
    this.id = data.id;
    this.sourceNodeId = data.sourceNodeId;
    this.targetNodeId = data.targetNodeId;
    this.type = data.type;
    this.weight = data.weight;
    this.confidence = data.confidence;
    this.metadata = data.metadata || {};
  }
}
