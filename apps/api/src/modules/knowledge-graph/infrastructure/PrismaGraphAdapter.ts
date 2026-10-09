import { PrismaClient } from '@prisma/client';
import { GraphNode } from '../domain/GraphNode';
import { GraphEdge } from '../domain/GraphEdge';
import { GraphNodeType } from '../domain/GraphNodeType';
import { GraphRelationType } from '../domain/GraphRelationType';
import { IGraphNodeStore, IGraphEdgeStore } from '../domain/GraphStoreInterfaces';

export interface PrismaGraphAdapterOptions {
  tenantId?: string;
  prisma?: PrismaClient;
}

export class PrismaGraphAdapter {
  private prisma: PrismaClient;
  private tenantId: string;

  constructor(options?: PrismaGraphAdapterOptions) {
    this.prisma = options?.prisma || new PrismaClient();
    this.tenantId = options?.tenantId || 'default';
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  // ==========================================
  // GraphNode Operations
  // ==========================================

  async createNode(node: GraphNode): Promise<{ status: 'CREATED' | 'EXISTS'; node: GraphNode }> {
    const existing = await this.findNode(node.id);
    if (existing) {
      return { status: 'EXISTS', node: existing };
    }

    await this.prisma.graphNodeRecord.create({
      data: {
        tenantId: this.tenantId,
        id: node.id,
        type: node.type,
        properties: node.properties as any,
        metadata: node.metadata as any,
        createdAt: new Date(node.metadata?.createdAt || Date.now()),
      },
    });

    return { status: 'CREATED', node };
  }

  async findNode(id: string): Promise<GraphNode | undefined> {
    const row = await this.prisma.graphNodeRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id,
        },
      },
    });

    if (!row) return undefined;

    return {
      id: row.id,
      type: row.type as GraphNodeType,
      properties: (row.properties as Record<string, unknown>) || {},
      metadata: (row.metadata as any) || {},
    };
  }

  async existsNode(id: string): Promise<boolean> {
    const node = await this.findNode(id);
    return !!node;
  }

  async listNodes(): Promise<GraphNode[]> {
    const rows = await this.prisma.graphNodeRecord.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type as GraphNodeType,
      properties: (row.properties as Record<string, unknown>) || {},
      metadata: (row.metadata as any) || {},
    }));
  }

  async countNodes(): Promise<number> {
    return this.prisma.graphNodeRecord.count({
      where: { tenantId: this.tenantId },
    });
  }

  // ==========================================
  // GraphEdge Operations
  // ==========================================

  async createEdge(edge: GraphEdge): Promise<{ status: 'CREATED' | 'EXISTS'; edge: GraphEdge }> {
    // 1. Validação de integridade: nós origem e destino devem existir no mesmo tenant
    const fromNode = await this.findNode(edge.from);
    const toNode = await this.findNode(edge.to);

    if (!fromNode || !toNode) {
      throw new Error(
        `Nó de origem ou destino inexistente no tenant "${this.tenantId}": from="${edge.from}" (${!fromNode ? 'não encontrado' : 'ok'}), to="${edge.to}" (${!toNode ? 'não encontrado' : 'ok'})`
      );
    }

    // 2. Verificação de aresta existente e idempotência
    const existing = await this.findEdge(edge.id);

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

      return { status: 'EXISTS', edge: existing };
    }

    await this.prisma.graphEdgeRecord.create({
      data: {
        tenantId: this.tenantId,
        id: edge.id,
        from: edge.from,
        to: edge.to,
        relation: edge.relation,
        weight: typeof edge.weight === 'number' ? edge.weight : 1.0,
        metadata: edge.metadata as any,
        createdAt: new Date(edge.metadata?.createdAt || Date.now()),
      },
    });

    return { status: 'CREATED', edge };
  }

  async findEdge(id: string): Promise<GraphEdge | undefined> {
    const row = await this.prisma.graphEdgeRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id,
        },
      },
    });

    if (!row) return undefined;

    return {
      id: row.id,
      from: row.from,
      to: row.to,
      relation: row.relation as GraphRelationType,
      weight: row.weight,
      metadata: (row.metadata as any) || {},
    };
  }

  async existsEdge(id: string): Promise<boolean> {
    const edge = await this.findEdge(id);
    return !!edge;
  }

  async listEdges(): Promise<GraphEdge[]> {
    const rows = await this.prisma.graphEdgeRecord.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      from: row.from,
      to: row.to,
      relation: row.relation as GraphRelationType,
      weight: row.weight,
      metadata: (row.metadata as any) || {},
    }));
  }

  async findEdgesFrom(fromId: string): Promise<GraphEdge[]> {
    const rows = await this.prisma.graphEdgeRecord.findMany({
      where: {
        tenantId: this.tenantId,
        from: fromId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      from: row.from,
      to: row.to,
      relation: row.relation as GraphRelationType,
      weight: row.weight,
      metadata: (row.metadata as any) || {},
    }));
  }

  async findEdgesTo(toId: string): Promise<GraphEdge[]> {
    const rows = await this.prisma.graphEdgeRecord.findMany({
      where: {
        tenantId: this.tenantId,
        to: toId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      from: row.from,
      to: row.to,
      relation: row.relation as GraphRelationType,
      weight: row.weight,
      metadata: (row.metadata as any) || {},
    }));
  }

  async countEdges(): Promise<number> {
    return this.prisma.graphEdgeRecord.count({
      where: { tenantId: this.tenantId },
    });
  }

  // ==========================================
  // Store Adapters (IGraphNodeStore & IGraphEdgeStore)
  // ==========================================

  asNodeStore(): IGraphNodeStore {
    return {
      register: async (node: GraphNode): Promise<void> => {
        await this.createNode(node);
      },
      find: async (id: string): Promise<GraphNode | undefined> => {
        return this.findNode(id);
      },
      list: async (): Promise<GraphNode[]> => {
        return this.listNodes();
      },
      clear: async (): Promise<void> => {
        await this.prisma.graphNodeRecord.deleteMany({
          where: { tenantId: this.tenantId },
        });
      },
    };
  }

  asEdgeStore(): IGraphEdgeStore {
    return {
      register: async (edge: GraphEdge): Promise<void> => {
        await this.createEdge(edge);
      },
      find: async (id: string): Promise<GraphEdge | undefined> => {
        return this.findEdge(id);
      },
      findByFrom: async (fromId: string): Promise<GraphEdge[]> => {
        return this.findEdgesFrom(fromId);
      },
      findByTo: async (toId: string): Promise<GraphEdge[]> => {
        return this.findEdgesTo(toId);
      },
      list: async (): Promise<GraphEdge[]> => {
        return this.listEdges();
      },
      clear: async (): Promise<void> => {
        await this.prisma.graphEdgeRecord.deleteMany({
          where: { tenantId: this.tenantId },
        });
      },
    };
  }

  // ==========================================
  // Cleanup Operations
  // ==========================================

  async clear(): Promise<void> {
    // Delete edges first to respect foreign keys, then nodes
    await this.prisma.graphEdgeRecord.deleteMany({
      where: { tenantId: this.tenantId },
    });
    await this.prisma.graphNodeRecord.deleteMany({
      where: { tenantId: this.tenantId },
    });
  }
}
