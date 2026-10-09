import { GraphNode } from '../domain/GraphNode';
import { GraphEdge } from '../domain/GraphEdge';
import { GraphRegistry } from './GraphRegistry';
import { GraphEdgeRegistry } from './GraphEdgeRegistry';
import { IGraphNodeStore, IGraphEdgeStore } from '../domain/GraphStoreInterfaces';

export class GraphService {
  constructor(
    private nodeRegistry: typeof GraphRegistry | IGraphNodeStore,
    private edgeRegistry: typeof GraphEdgeRegistry | IGraphEdgeStore
  ) {}

  async createNode(node: GraphNode): Promise<{ status: 'CREATED' | 'EXISTS'; node: GraphNode }> {
    const start = Date.now();
    const existing = await this.nodeRegistry.find(node.id);
    let status: 'CREATED' | 'EXISTS';

    if (existing) {
      status = 'EXISTS';
    } else {
      await this.nodeRegistry.register(node);
      status = 'CREATED';
    }

    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        event: 'graph_create_node',
        nodeId: node.id,
        type: node.type,
        status,
        elapsedTime: duration,
      })
    );

    return { status, node: existing ?? node };
  }

  async createEdge(edge: GraphEdge): Promise<{ status: 'CREATED' | 'EXISTS'; edge: GraphEdge }> {
    const start = Date.now();

    // 1. Validação de existência de nós de origem e destino
    const fromNode = await this.nodeRegistry.find(edge.from);
    const toNode = await this.nodeRegistry.find(edge.to);

    if (!fromNode || !toNode) {
      throw new Error(
        `Nó de origem ou destino inexistente: from="${edge.from}" (${!fromNode ? 'não encontrado' : 'ok'}), to="${edge.to}" (${!toNode ? 'não encontrado' : 'ok'})`
      );
    }

    // 2. Verificação de aresta existente e idempotência
    const existing = await this.edgeRegistry.find(edge.id);
    let status: 'CREATED' | 'EXISTS';

    if (existing) {
      const isIdentical =
        existing.from === edge.from &&
        existing.to === edge.to &&
        existing.relation === edge.relation;

      if (!isIdentical) {
        throw new Error(
          `Conflito estrutural de aresta para id "${edge.id}": aresta existente possui from="${existing.from}", to="${existing.to}", relation="${existing.relation}"; recebido from="${edge.from}", to="${edge.to}", relation="${edge.relation}".`
        );
      }

      // Idempotente: mesma aresta com mesmo ID e mesma relação/nós
      status = 'EXISTS';
    } else {
      await this.edgeRegistry.register(edge);
      status = 'CREATED';
    }

    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        event: 'graph_create_edge',
        edgeId: edge.id,
        relation: edge.relation,
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        status,
        elapsedTime: duration,
      })
    );

    return { status, edge: existing ?? edge };
  }

  async findNode(id: string): Promise<GraphNode | undefined> {
    const start = Date.now();
    const result = await this.nodeRegistry.find(id);
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        event: 'graph_find_node',
        nodeId: id,
        found: !!result,
        elapsedTime: duration,
      })
    );

    return result;
  }

  async findEdgesFrom(fromId: string): Promise<GraphEdge[]> {
    const start = Date.now();
    const result = await this.edgeRegistry.findByFrom(fromId);
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        event: 'graph_find_edges_from',
        from: fromId,
        count: result.length,
        elapsedTime: duration,
      })
    );

    return result;
  }

  async findEdgesTo(toId: string): Promise<GraphEdge[]> {
    const start = Date.now();
    const result = await this.edgeRegistry.findByTo(toId);
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        event: 'graph_find_edges_to',
        to: toId,
        count: result.length,
        elapsedTime: duration,
      })
    );

    return result;
  }

  async clear(): Promise<void> {
    const start = Date.now();
    await this.nodeRegistry.clear();
    await this.edgeRegistry.clear();
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        event: 'graph_clear',
        elapsedTime: duration,
      })
    );
  }
}
