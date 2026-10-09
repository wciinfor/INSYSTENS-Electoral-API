import { SignalRule } from '../../domain/SignalRule';
import { GraphNode } from '../../../knowledge-graph/domain/GraphNode';
import { GraphEdge } from '../../../knowledge-graph/domain/GraphEdge';
import { StrategicSignal } from '../../domain/StrategicSignal';

export class TerritorialOpportunityRule implements SignalRule {
  readonly id = 'territorial-opportunity';
  readonly name = 'Territorial Opportunity Rule';
  readonly priority = 10;

  async evaluate(nodes: GraphNode[], edges: GraphEdge[]): Promise<StrategicSignal[]> {
    const signals: StrategicSignal[] = [];

    // Filter municipality nodes
    const municipalities = nodes.filter(n => n.type === 'municipality');

    for (const mun of municipalities) {
      // Find if there is any candidate receiving votes from this municipality
      const hasVotes = edges.some(
        e => e.to === mun.id && e.relation === 'received_votes_from'
      );

      if (!hasVotes) {
        signals.push({
          id: `${this.id}_${mun.id}`,
          type: 'territorial_opportunity',
          severity: 'medium',
          confidence: 1.0,
          context: { municipalityId: mun.id },
          reason: `Município "${mun.id}" não possui votos recebidos por nenhum candidato registrado.`,
          metadata: {
            source: mun.metadata.source,
            createdAt: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      }
    }

    return signals;
  }
}

export class HighRelationshipDensityRule implements SignalRule {
  readonly id = 'high-relationship-density';
  readonly name = 'High Relationship Density Rule';
  readonly priority = 20;

  async evaluate(nodes: GraphNode[], edges: GraphEdge[]): Promise<StrategicSignal[]> {
    const signals: StrategicSignal[] = [];

    for (const node of nodes) {
      // Count edges where node.id appears in from or to
      const connectedEdges = edges.filter(e => e.from === node.id || e.to === node.id);

      if (connectedEdges.length > 5) {
        signals.push({
          id: `${this.id}_${node.id}`,
          type: 'high_relationship_density',
          severity: 'high',
          confidence: 1.0,
          context: { nodeId: node.id, connectionCount: connectedEdges.length },
          reason: `Nó "${node.id}" possui alta densidade de conexões (${connectedEdges.length} conexões).`,
          metadata: {
            source: node.metadata.source,
            createdAt: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      }
    }

    return signals;
  }
}

export class OrphanNodeRule implements SignalRule {
  readonly id = 'orphan-node';
  readonly name = 'Orphan Node Rule';
  readonly priority = 30;

  async evaluate(nodes: GraphNode[], edges: GraphEdge[]): Promise<StrategicSignal[]> {
    const signals: StrategicSignal[] = [];

    for (const node of nodes) {
      // Ignore nodes type === 'generic' to avoid noise
      if (node.type === 'generic') {
        continue;
      }

      // Check if any edge connects to this node
      const hasConnections = edges.some(e => e.from === node.id || e.to === node.id);

      if (!hasConnections) {
        signals.push({
          id: `${this.id}_${node.id}`,
          type: 'orphan_node',
          severity: 'critical',
          confidence: 1.0,
          context: { nodeId: node.id },
          reason: `Nó "${node.id}" do tipo "${node.type}" não possui conexões no grafo.`,
          metadata: {
            source: node.metadata.source,
            createdAt: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      }
    }

    return signals;
  }
}
