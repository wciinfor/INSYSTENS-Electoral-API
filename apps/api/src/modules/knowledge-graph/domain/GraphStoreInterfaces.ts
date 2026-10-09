import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';

export interface IGraphNodeStore {
  register(node: GraphNode): void | Promise<void>;
  find(id: string): GraphNode | undefined | Promise<GraphNode | undefined>;
  list(): GraphNode[] | Promise<GraphNode[]>;
  clear(): void | Promise<void>;
}

export interface IGraphEdgeStore {
  register(edge: GraphEdge): void | Promise<void>;
  find(id: string): GraphEdge | undefined | Promise<GraphEdge | undefined>;
  findByFrom(fromId: string): GraphEdge[] | Promise<GraphEdge[]>;
  findByTo(toId: string): GraphEdge[] | Promise<GraphEdge[]>;
  list(): GraphEdge[] | Promise<GraphEdge[]>;
  clear(): void | Promise<void>;
}
