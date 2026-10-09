import { GraphEdge } from '../domain/GraphEdge';

export class GraphEdgeRegistry {
  private static edges = new Map<string, GraphEdge>();

  static register(edge: GraphEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`GraphEdge com id "${edge.id}" já está registrado.`);
    }
    this.edges.set(edge.id, edge);
  }

  static find(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  static findByFrom(fromId: string): GraphEdge[] {
    const results: GraphEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.from === fromId) {
        results.push(edge);
      }
    }
    return results;
  }

  static findByTo(toId: string): GraphEdge[] {
    const results: GraphEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.to === toId) {
        results.push(edge);
      }
    }
    return results;
  }

  static list(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  static clear(): void {
    this.edges.clear();
  }
}
