import { PrismaClient } from '@prisma/client';
import { DecisionRecord } from '../domain/DecisionRecord';
import { IDecisionRepository } from '../domain/IDecisionRepository';

export interface PrismaDecisionRepositoryOptions {
  tenantId: string;
  prisma?: PrismaClient;
}

export class PrismaDecisionRepository implements IDecisionRepository {
  private readonly prisma: PrismaClient;
  private readonly tenantId: string;

  constructor(options: PrismaDecisionRepositoryOptions) {
    if (!options || !options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim() === '') {
      throw new Error('PrismaDecisionRepository: tenantId é obrigatório e não pode ser vazio.');
    }
    this.prisma = options.prisma || new PrismaClient();
    this.tenantId = options.tenantId;
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  async store(decision: DecisionRecord): Promise<void> {
    const targetTenantId = decision.tenantId || this.tenantId;
    if (targetTenantId !== this.tenantId) {
      return;
    }

    await (this.prisma as any).decisionRecord.upsert({
      where: {
        tenantId_id: {
          tenantId: targetTenantId,
          id: decision.id,
        },
      },
      create: {
        tenantId: targetTenantId,
        id: decision.id,
        category: decision.category,
        priority: decision.priority,
        title: decision.title,
        summary: decision.summary,
        expectedImpact: decision.expectedImpact,
        confidence: decision.confidence,
        reasons: decision.reasons as any,
        recommendedActions: decision.recommendedActions as any,
        relatedSignals: decision.relatedSignals as any,
        metadata: decision.metadata as any,
        createdAt: decision.createdAt ? new Date(decision.createdAt) : new Date(),
      },
      update: {
        category: decision.category,
        priority: decision.priority,
        title: decision.title,
        summary: decision.summary,
        expectedImpact: decision.expectedImpact,
        confidence: decision.confidence,
        reasons: decision.reasons as any,
        recommendedActions: decision.recommendedActions as any,
        relatedSignals: decision.relatedSignals as any,
        metadata: decision.metadata as any,
      },
    });
  }

  async storeMany(decisions: DecisionRecord[]): Promise<void> {
    for (const d of decisions) {
      await this.store(d);
    }
  }

  async find(id: string): Promise<DecisionRecord | null> {
    const row = await (this.prisma as any).decisionRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id,
        },
      },
    });

    if (!row) return null;

    return {
      tenantId: row.tenantId,
      id: row.id,
      category: row.category,
      priority: row.priority,
      title: row.title,
      summary: row.summary,
      expectedImpact: row.expectedImpact,
      confidence: row.confidence,
      reasons: (row.reasons as any) || [],
      recommendedActions: (row.recommendedActions as any) || [],
      relatedSignals: (row.relatedSignals as any) || [],
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getById(id: string): Promise<DecisionRecord | null> {
    return this.find(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma as any).decisionRecord.count({
      where: {
        tenantId: this.tenantId,
        id,
      },
    });
    return count > 0;
  }

  async list(): Promise<DecisionRecord[]> {
    const rows = await (this.prisma as any).decisionRecord.findMany({
      where: {
        tenantId: this.tenantId,
      },
    });

    return rows.map((row: any) => ({
      tenantId: row.tenantId,
      id: row.id,
      category: row.category,
      priority: row.priority,
      title: row.title,
      summary: row.summary,
      expectedImpact: row.expectedImpact,
      confidence: row.confidence,
      reasons: (row.reasons as any) || [],
      recommendedActions: (row.recommendedActions as any) || [],
      relatedSignals: (row.relatedSignals as any) || [],
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async count(): Promise<number> {
    return await (this.prisma as any).decisionRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });
  }

  async clear(): Promise<void> {
    await (this.prisma as any).decisionRecord.deleteMany({
      where: {
        tenantId: this.tenantId,
      },
    });
  }
}
