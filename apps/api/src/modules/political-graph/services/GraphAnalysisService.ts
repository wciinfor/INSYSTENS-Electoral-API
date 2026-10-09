import { PoliticalGraph } from '../entities/PoliticalGraph';
import { PoliticalNode } from '../entities/PoliticalNode';
import { PoliticalEdge } from '../entities/PoliticalEdge';
import { PoliticalNodeType, PoliticalEdgeType } from '../types/GraphTypes';

export interface GraphSummary {
  nodeCountByType: Record<string, number>;
  edgeCountByType: Record<string, number>;
  density: number;
}

export class GraphAnalysisService {
  /**
   * Identifica nós com maior centralidade de influência no grafo
   */
  static findInfluenceNodes(graph: PoliticalGraph): PoliticalNode[] {
    // Retorna os líderes com maior score de influência
    return graph.nodes
      .filter(node => node.type === PoliticalNodeType.LEADER)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3);
  }

  /**
   * Encontra as conexões mais fortes (arestas com maior peso/confiança)
   */
  static findStrongConnections(graph: PoliticalGraph): PoliticalEdge[] {
    return graph.edges
      .filter(edge => edge.weight !== undefined || edge.confidence !== undefined)
      .sort((a, b) => {
        const valA = (a.weight || 0) + (a.confidence || 0);
        const valB = (b.weight || 0) + (b.confidence || 0);
        return valB - valA;
      })
      .slice(0, 5);
  }

  /**
   * Mapeia regiões (cidades/zonas) que possuem baixa densidade de conexões
   */
  static findIsolatedRegions(graph: PoliticalGraph): any[] {
    const cityNodes = graph.nodes.filter(node => node.type === PoliticalNodeType.CITY);
    
    // Retorna análises territoriais de isolamento de rede
    return cityNodes.map(city => {
      const connectionsCount = graph.edges.filter(
        edge => edge.sourceNodeId === city.id || edge.targetNodeId === city.id
      ).length;

      return {
        regionId: city.id,
        label: city.label,
        status: connectionsCount < 2 ? 'ISOLATED' : 'STABLE',
        densityScore: connectionsCount * 10,
      };
    });
  }

  /**
   * Cruza conexões e identifica oportunidades estratégicas
   */
  static findStrategicOpportunities(graph: PoliticalGraph): any[] {
    const influenceNodes = this.findInfluenceNodes(graph);
    return influenceNodes.map(leader => ({
      leaderId: leader.id,
      leaderLabel: leader.label,
      recommendedZone: leader.metadata.region || 'Zona Padrão',
      action: 'Delegar liderança regional para cobertura de subseções periféricas desassistidas.',
    }));
  }

  /**
   * Gera métricas topológicas consolidadas do grafo
   */
  static generateGraphSummary(graph: PoliticalGraph): GraphSummary {
    const nodeCountByType: Record<string, number> = {};
    const edgeCountByType: Record<string, number> = {};

    graph.nodes.forEach(node => {
      nodeCountByType[node.type] = (nodeCountByType[node.type] || 0) + 1;
    });

    graph.edges.forEach(edge => {
      edgeCountByType[edge.type] = (edgeCountByType[edge.type] || 0) + 1;
    });

    const N = graph.nodes.length;
    const E = graph.edges.length;
    const density = N > 1 ? (2 * E) / (N * (N - 1)) : 0;

    return {
      nodeCountByType,
      edgeCountByType,
      density: parseFloat(density.toFixed(4)),
    };
  }
}
