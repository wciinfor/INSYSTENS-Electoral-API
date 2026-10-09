import { GraphNode } from '../domain/GraphNode';
import { GraphEdge } from '../domain/GraphEdge';
import { RelationshipRegistry } from './RelationshipRegistry';
import { GraphBuilder } from './GraphBuilder';

export class RelationshipEngine {
  constructor(
    private registry: typeof RelationshipRegistry,
    private builder: typeof GraphBuilder
  ) {}

  async evaluate(sourceNode: GraphNode, targetNode: GraphNode): Promise<GraphEdge[]> {
    const edges: GraphEdge[] = [];
    const rules = this.registry.list();

    for (const rule of rules) {
      const start = Date.now();
      const result = await rule.evaluate(sourceNode, targetNode);
      const duration = Date.now() - start;

      if (result.matched && result.relation) {
        const confidence = typeof result.confidence === 'number' ? result.confidence : 1.0;
        const weight = typeof result.weight === 'number' ? result.weight : 1.0;
        const source = result.metadata?.source || sourceNode.metadata.source;

        // Build edge deterministic format
        const edge = this.builder.buildEdge(
          sourceNode,
          targetNode,
          result.relation,
          weight,
          source
        );

        // Adjust built confidence if calculated explicitly in rule result
        if (typeof result.confidence === 'number') {
          edge.metadata.confidence = confidence;
        }

        edges.push(edge);

        console.log(
          JSON.stringify({
            rule: rule.id,
            relation: result.relation,
            confidence: edge.metadata.confidence,
            elapsedTime: duration,
            edgesCreated: 1,
          })
        );
      } else {
        console.log(
          JSON.stringify({
            rule: rule.id,
            relation: result.relation || 'none',
            confidence: 0,
            elapsedTime: duration,
            edgesCreated: 0,
          })
        );
      }
    }

    return edges;
  }
}
