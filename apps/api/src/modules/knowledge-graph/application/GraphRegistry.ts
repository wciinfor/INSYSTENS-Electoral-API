import { GraphNode } from '../domain/GraphNode';

export class GraphRegistry {
  private static nodes = new Map<string, GraphNode>();

  static register(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`GraphNode com id "${node.id}" já está registrado.`);
    }
    this.nodes.set(node.id, node);
  }

  static find(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  static list(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  static clear(): void {
    this.nodes.clear();
  }
}
