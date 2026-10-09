import { PoliticalIntelligenceContext } from '../../../core/kernel/types';
import { IntelligenceRepository } from '../../../core/repositories/interfaces/IntelligenceRepository';
import { PoliticalGraph } from '../entities/PoliticalGraph';
import { PoliticalNode } from '../entities/PoliticalNode';
import { PoliticalEdge } from '../entities/PoliticalEdge';
import { PoliticalNodeType, PoliticalEdgeType } from '../types/GraphTypes';

export class GraphBuilder {
  /**
   * Constrói a estrutura do grafo de conhecimento político com base no contexto ativo
   * e dados analíticos providos pelo repositório (IRL).
   */
  static async buildFromContext(
    context: PoliticalIntelligenceContext,
    repository: IntelligenceRepository
  ): Promise<PoliticalGraph> {
    const accountId = context.accountId;
    const uf = context.geographicContext.uf || 'SP';
    const candidateName = context.candidateContext.candidateName || 'Candidato';
    const partyName = context.candidateContext.party || 'MDB';

    const nodes: PoliticalNode[] = [];
    const edges: PoliticalEdge[] = [];

    // 1. Criar nó do Político
    const politicianNode = new PoliticalNode({
      id: `pol-${accountId}`,
      type: PoliticalNodeType.POLITICIAN,
      label: candidateName,
      metadata: { role: context.candidateContext.role },
      score: 85,
    });
    nodes.push(politicianNode);

    // 2. Criar nó do Partido
    const partyNode = new PoliticalNode({
      id: `pty-${partyName}`,
      type: PoliticalNodeType.PARTY,
      label: partyName,
      metadata: {},
    });
    nodes.push(partyNode);

    // Conectar Político -> Partido
    edges.push(new PoliticalEdge({
      id: `edge-pol-pty-${accountId}`,
      sourceNodeId: politicianNode.id,
      targetNodeId: partyNode.id,
      type: PoliticalEdgeType.BELONGS_TO,
      metadata: {},
    }));

    // 3. Criar nó da Cidade / Geografia
    const cityCode = context.geographicContext.cityCode || 3550308;
    const cityNode = new PoliticalNode({
      id: `geo-city-${cityCode}`,
      type: PoliticalNodeType.CITY,
      label: `Município ${cityCode} (${uf})`,
      metadata: { uf },
    });
    nodes.push(cityNode);

    // Conectar Político -> Cidade (Representação)
    edges.push(new PoliticalEdge({
      id: `edge-pol-city-${accountId}`,
      sourceNodeId: politicianNode.id,
      targetNodeId: cityNode.id,
      type: PoliticalEdgeType.REPRESENTS,
      metadata: {},
    }));

    // 4. Mapear Lideranças e Eleitores de forma realista baseado no repositório
    const politicalPresence = await repository.getPoliticalPresence(accountId);
    const leadersCount = politicalPresence.totalLeaders || 5;

    for (let i = 1; i <= leadersCount; i++) {
      const leaderId = `ldr-acc-${accountId}-${i}`;
      const leaderNode = new PoliticalNode({
        id: leaderId,
        type: PoliticalNodeType.LEADER,
        label: `Líder de Região ${String.fromCharCode(64 + i)}`,
        metadata: { region: `Zona ${100 + i}` },
        score: 75,
      });
      nodes.push(leaderNode);

      // Conectar Líder -> Político (Suporte)
      edges.push(new PoliticalEdge({
        id: `edge-ldr-pol-${leaderId}`,
        sourceNodeId: leaderNode.id,
        targetNodeId: politicianNode.id,
        type: PoliticalEdgeType.SUPPORTED_BY,
        confidence: 0.95,
        metadata: {},
      }));

      // Criar alguns nós de Eleitores (Voters) e ligar ao Líder
      const votersForThisLeader = 3;
      for (let j = 1; j <= votersForThisLeader; j++) {
        const voterId = `vtr-ldr-${i}-${j}`;
        const voterNode = new PoliticalNode({
          id: voterId,
          type: PoliticalNodeType.VOTER,
          label: `Eleitor ${i}-${j}`,
          metadata: {},
        });
        nodes.push(voterNode);

        // Líder -> Influencia -> Eleitor
        edges.push(new PoliticalEdge({
          id: `edge-ldr-vtr-${voterId}`,
          sourceNodeId: leaderNode.id,
          targetNodeId: voterNode.id,
          type: PoliticalEdgeType.INFLUENCES,
          weight: 0.8,
          metadata: {},
        }));
      }
    }

    return new PoliticalGraph({
      id: `graph-acc-${accountId}`,
      accountId,
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        graphEngine: 'TS-Native-Core',
      },
    });
  }
}
