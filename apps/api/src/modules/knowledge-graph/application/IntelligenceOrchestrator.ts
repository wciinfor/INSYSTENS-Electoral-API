import { MappedRecord } from '../../data-platform/domain/MappedRecord';
import { RepositoryRecord } from '../../strategic-repository/domain/RepositoryRecord';
import { RepositoryService } from '../../strategic-repository/application/RepositoryService';
import { RepositoryRecordFactory } from '../../strategic-repository/application/RepositoryRecordFactory';
import { GraphFactory } from './GraphFactory';
import { GraphNode } from '../domain/GraphNode';
import { GraphEdge } from '../domain/GraphEdge';
import { GraphService } from './GraphService';
import { GraphRegistry } from './GraphRegistry';
import { GraphEdgeRegistry } from './GraphEdgeRegistry';
import { IGraphNodeStore, IGraphEdgeStore } from '../domain/GraphStoreInterfaces';
import { RelationshipEngine } from './RelationshipEngine';
import { SignalEngine } from '../../strategic-signals/application/SignalEngine';
import { StrategicSignal } from '../../strategic-signals/domain/StrategicSignal';
import {
  OrchestratorContext,
  IntelligenceOrchestrationResult,
} from '../domain/IntelligenceOrchestratorTypes';

export class IntelligenceOrchestrator {
  constructor(
    private repositoryService: typeof RepositoryService,
    private graphService: GraphService,
    private relationshipEngine: RelationshipEngine,
    private signalEngine: SignalEngine,
    private graphRegistry: typeof GraphRegistry | IGraphNodeStore,
    private graphEdgeRegistry: typeof GraphEdgeRegistry | IGraphEdgeStore
  ) {}

  async orchestrate(context: OrchestratorContext): Promise<IntelligenceOrchestrationResult> {
    const startTime = Date.now();

    // A) Receber MappedRecord
    const { mappedRecord, targetRepositoryId } = context;
    if (!mappedRecord) {
      throw new Error('IntelligenceOrchestrator: MappedRecord é obrigatório no contexto.');
    }

    // B) Converter através de RepositoryRecordFactory.fromMappedRecord()
    const customId =
      context.metadata && typeof context.metadata.customId === 'string'
        ? context.metadata.customId
        : undefined;
    const repositoryRecord: RepositoryRecord = RepositoryRecordFactory.fromMappedRecord(
      mappedRecord,
      customId
    );

    // C) Armazenar através do RepositoryService no targetRepositoryId indicado
    await this.repositoryService.store(repositoryRecord, targetRepositoryId);

    // D) Criar GraphNode através do GraphFactory existente
    const graphNode: GraphNode = GraphFactory.createFromRecord(repositoryRecord);

    // E) Registrar o GraphNode no GraphService (idempotente)
    await this.graphService.createNode(graphNode);

    // F) Identificar candidatos relevantes para relacionamento
    // Candidatos são outros nós existentes no Knowledge Graph que não sejam o próprio nó
    const allNodes = await this.graphRegistry.list();
    const candidateNodes = allNodes.filter((node) => node.id !== graphNode.id);

    // G) Executar RelationshipEngine para avaliar relacionamentos
    const edgesCreated: GraphEdge[] = [];
    const evaluationErrors: string[] = [];

    for (const candidate of candidateNodes) {
      // Avalia em ambas as direções direcionadas
      let directEdges: GraphEdge[] = [];
      let reverseEdges: GraphEdge[] = [];

      try {
        directEdges = await this.relationshipEngine.evaluate(graphNode, candidate);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        evaluationErrors.push(errorMsg);
      }

      try {
        reverseEdges = await this.relationshipEngine.evaluate(candidate, graphNode);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        evaluationErrors.push(errorMsg);
      }

      // Registro de arestas não engole erros estruturais (ex: conflito estrutural ou nó inexistente)
      for (const edge of directEdges) {
        const edgeResult = await this.graphService.createEdge(edge);
        if (edgeResult.status === 'CREATED') {
          edgesCreated.push(edge);
        }
      }

      for (const edge of reverseEdges) {
        const edgeResult = await this.graphService.createEdge(edge);
        if (edgeResult.status === 'CREATED') {
          edgesCreated.push(edge);
        }
      }
    }

    // H) Obter estado consolidado de nós e arestas para alimentar o SignalEngine
    const currentNodes = await this.graphRegistry.list();
    const currentEdges = await this.graphEdgeRegistry.list();

    // I) Executar SignalEngine sobre o estado atualizado do grafo
    let signalsGenerated: StrategicSignal[] = [];
    let signalEngineError: string | undefined;

    try {
      signalsGenerated = await this.signalEngine.generateSignals(currentNodes, currentEdges);
    } catch (err: unknown) {
      signalEngineError = err instanceof Error ? err.message : String(err);
    }

    const elapsedTime = Date.now() - startTime;

    // Status:
    // SUCCESS: todas as etapas concluídas sem erros parciais
    // PARTIAL: registro e grafo foram processados, mas etapa de relacionamento ou sinal teve erro não fatal
    // FAILED: falha impeditiva (lançada antes se acontecer em A-E)
    let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
    if (evaluationErrors.length > 0 || signalEngineError !== undefined) {
      status = 'PARTIAL';
    }

    console.log(
      JSON.stringify({
        event: 'intelligence_orchestration_complete',
        recordId: repositoryRecord.id,
        nodeId: graphNode.id,
        edgesCreatedCount: edgesCreated.length,
        signalsGeneratedCount: signalsGenerated.length,
        status,
        elapsedTime,
      })
    );

    return {
      repositoryRecord,
      graphNode,
      edgesCreated,
      signalsGenerated,
      elapsedTime,
      status,
    };
  }
}
