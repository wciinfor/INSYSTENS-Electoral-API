import { IPoliticalGraph } from '../types/GraphTypes';
import { PoliticalNode } from './PoliticalNode';
import { PoliticalEdge } from './PoliticalEdge';

export class PoliticalGraph implements IPoliticalGraph {
  id: string;
  accountId: string;
  nodes: PoliticalNode[];
  edges: PoliticalEdge[];
  metadata: Record<string, any>;
  generatedAt: string;

  constructor(data: {
    id: string;
    accountId: string;
    nodes: PoliticalNode[];
    edges: PoliticalEdge[];
    metadata?: Record<string, any>;
    generatedAt?: string;
  }) {
    this.id = data.id;
    this.accountId = data.accountId;
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metadata = data.metadata || {};
    this.generatedAt = data.generatedAt || new Date().toISOString();
  }
}
