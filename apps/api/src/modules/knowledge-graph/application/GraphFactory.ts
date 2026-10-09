import { RepositoryRecord } from '../../strategic-repository/domain/RepositoryRecord';
import { GraphNode } from '../domain/GraphNode';
import { GraphNodeType } from '../domain/GraphNodeType';

export class GraphFactory {
  static createFromRecord(record: RepositoryRecord): GraphNode {
    const start = Date.now();

    // Mapping entity type safely, mapping any unaligned ones to 'generic'
    const supportedTypes: GraphNodeType[] = [
      'candidate',
      'party',
      'municipality',
      'election',
      'vote',
      'mandate',
      'organization',
      'person',
      'generic',
    ];
    const nodeType: GraphNodeType = supportedTypes.includes(record.entity as any)
      ? (record.entity as GraphNodeType)
      : 'generic';

    // Determining confidence priority: record.metadata.confidence or default to 1.0
    const confidence =
      typeof record.metadata?.confidence === 'number'
        ? record.metadata.confidence
        : 1.0;

    const node: GraphNode = {
      id: record.id,
      type: nodeType,
      properties: { ...(record.data || {}) },
      metadata: {
        source: record.source,
        confidence,
        createdAt: new Date().toISOString(),
        version: record.metadata?.version || '1.0.0',
      },
    };

    const elapsedTime = Date.now() - start;

    console.log(
      JSON.stringify({
        nodeType: node.type,
        source: node.metadata.source,
        confidence: node.metadata.confidence,
        elapsedTime,
      })
    );

    return node;
  }
}
