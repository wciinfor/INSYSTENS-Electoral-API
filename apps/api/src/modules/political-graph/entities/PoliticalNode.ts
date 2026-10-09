import { IPoliticalNode, PoliticalNodeType } from '../types/GraphTypes';

export class PoliticalNode implements IPoliticalNode {
  id: string;
  type: PoliticalNodeType;
  label: string;
  metadata: Record<string, any>;
  score?: number;
  createdAt?: string;

  constructor(data: IPoliticalNode) {
    this.id = data.id;
    this.type = data.type;
    this.label = data.label;
    this.metadata = data.metadata || {};
    this.score = data.score;
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}
