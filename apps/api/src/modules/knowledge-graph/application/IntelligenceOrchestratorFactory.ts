import { IntelligenceOrchestrator } from './IntelligenceOrchestrator';
import { GraphService } from './GraphService';
import { GraphRegistry } from './GraphRegistry';
import { GraphEdgeRegistry } from './GraphEdgeRegistry';
import { GraphBuilder } from './GraphBuilder';
import { RelationshipEngine } from './RelationshipEngine';
import { RelationshipRegistry } from './RelationshipRegistry';
import { SignalEngine } from '../../strategic-signals/application/SignalEngine';
import { SignalRegistry } from '../../strategic-signals/application/SignalRegistry';
import { RepositoryService } from '../../strategic-repository/application/RepositoryService';
import { RepositoryRegistry } from '../../strategic-repository/application/RepositoryRegistry';
import { RepositoryManifest } from '../../strategic-repository/domain/RepositoryManifest';
import { PrismaStrategicRepository } from '../../strategic-repository/infrastructure/PrismaStrategicRepository';
import { PrismaStrategicSignalRepository } from '../../strategic-signals/infrastructure/PrismaStrategicSignalRepository';
import { PrismaGraphAdapter } from '../infrastructure/PrismaGraphAdapter';
import { PrismaClient } from '@prisma/client';

export interface CreateOrchestratorOptions {
  tenantId?: string;
  prisma?: PrismaClient;
  usePersistentStores?: boolean;
}

export class IntelligenceOrchestratorFactory {
  /**
   * Cria uma instância de IntelligenceOrchestrator configurada para produção ou testes.
   * Se `usePersistentStores: true`, instancia e conecta `PrismaStrategicRepository` e `PrismaGraphAdapter`.
   * Caso contrário, utiliza os registries em memória padrão do sistema.
   */
  static create(options?: CreateOrchestratorOptions): IntelligenceOrchestrator {
    const tenantId = options?.tenantId || 'default';
    const usePersistent = options?.usePersistentStores ?? false;

    let graphService: GraphService;
    let nodeStore: typeof GraphRegistry | any = GraphRegistry;
    let edgeStore: typeof GraphEdgeRegistry | any = GraphEdgeRegistry;

    if (usePersistent) {
      const graphAdapter = new PrismaGraphAdapter({
        tenantId,
        prisma: options?.prisma,
      });

      nodeStore = graphAdapter.asNodeStore();
      edgeStore = graphAdapter.asEdgeStore();

      graphService = new GraphService(nodeStore, edgeStore);

      // Garante que o PrismaStrategicRepository esteja registrado no RepositoryRegistry para o tenant
      const repoManifest: RepositoryManifest = {
        id: `prisma-strategic-repo-${tenantId}`,
        name: `Prisma Strategic Repository (${tenantId})`,
        version: '1.0.0',
        supportedEntities: ['candidate', 'party', 'municipality', 'election', 'vote'],
      };

      if (!RepositoryRegistry.find(repoManifest.id)) {
        const prismaRepo = new PrismaStrategicRepository(repoManifest, {
          tenantId,
          prisma: options?.prisma,
        });
        RepositoryRegistry.register(prismaRepo);
      }
    } else {
      graphService = new GraphService(GraphRegistry, GraphEdgeRegistry);
    }

    const relationshipEngine = new RelationshipEngine(RelationshipRegistry, GraphBuilder);
    const signalRepo = usePersistent
      ? new PrismaStrategicSignalRepository({ tenantId, prisma: options?.prisma })
      : undefined;
    const signalEngine = new SignalEngine(SignalRegistry, signalRepo);

    return new IntelligenceOrchestrator(
      RepositoryService,
      graphService,
      relationshipEngine,
      signalEngine,
      nodeStore,
      edgeStore
    );
  }
}
