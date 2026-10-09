import { GraphNode } from '../domain/GraphNode';
import { GraphEdge } from '../domain/GraphEdge';
import { GraphRelationType } from '../domain/GraphRelationType';

export class GraphBuilder {
  static buildEdge(
    fromNode: GraphNode,
    toNode: GraphNode,
    relation: GraphRelationType,
    weight = 1.0,
    source?: string
  ): GraphEdge {
    const id = `${fromNode.id}_${relation}_${toNode.id}`;
    
    const confidence = (fromNode.metadata.confidence + toNode.metadata.confidence) / 2;
    const finalSource = source || fromNode.metadata.source;

    return {
      id,
      from: fromNode.id,
      to: toNode.id,
      relation,
      weight,
      metadata: {
        source: finalSource,
        confidence,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }
}
