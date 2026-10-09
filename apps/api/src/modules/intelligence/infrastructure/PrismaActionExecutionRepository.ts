import { PrismaClient } from '@prisma/client';
import { ActionExecutionRecord, ActionExecutionStatus, ActionExecutionMode } from '../domain/ActionExecutionRecord';
import { IActionExecutionRepository } from '../domain/IActionExecutionRepository';

export interface PrismaActionExecutionRepositoryOptions {
  tenantId: string;
  prisma?: PrismaClient;
}

export class PrismaActionExecutionRepository implements IActionExecutionRepository {
  private readonly prisma: PrismaClient;
  private readonly tenantId: string;

  constructor(options: PrismaActionExecutionRepositoryOptions) {
    if (!options || !options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim() === '') {
      throw new Error('PrismaActionExecutionRepository: tenantId é obrigatório e não pode ser vazio.');
    }
    this.prisma = options.prisma || new PrismaClient();
    this.tenantId = options.tenantId;
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  async store(execution: ActionExecutionRecord, tx?: any): Promise<void> {
    const targetTenantId = execution.tenantId || this.tenantId;
    if (targetTenantId !== this.tenantId) {
      return;
    }

    const client = tx || this.prisma;

    await (client as any).actionExecutionRecord.create({
      data: {
        tenantId: targetTenantId,
        id: execution.id,
        proposalId: execution.proposalId,
        decisionId: execution.decisionId,
        attemptNumber: execution.attemptNumber,
        status: execution.status,
        mode: execution.mode,
        executedBy: execution.executedBy as any,
        result: (execution.result as any) || null,
        error: execution.error || null,
        dispatchedAt: execution.dispatchedAt ? new Date(execution.dispatchedAt) : null,
        completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
        metadata: execution.metadata as any,
        createdAt: execution.createdAt ? new Date(execution.createdAt) : new Date(),
      },
    });
  }

  async findById(id: string): Promise<ActionExecutionRecord | null> {
    const row = await (this.prisma as any).actionExecutionRecord.findUnique({
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
      proposalId: row.proposalId,
      decisionId: row.decisionId,
      attemptNumber: row.attemptNumber,
      status: row.status as ActionExecutionStatus,
      mode: row.mode as ActionExecutionMode,
      executedBy: row.executedBy as any,
      result: row.result as any,
      error: row.error,
      dispatchedAt: row.dispatchedAt,
      completedAt: row.completedAt,
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByAttempt(proposalId: string, attemptNumber: number): Promise<ActionExecutionRecord | null> {
    const row = await (this.prisma as any).actionExecutionRecord.findUnique({
      where: {
        tenantId_proposalId_attemptNumber: {
          tenantId: this.tenantId,
          proposalId,
          attemptNumber,
        },
      },
    });

    if (!row) return null;

    return {
      tenantId: row.tenantId,
      id: row.id,
      proposalId: row.proposalId,
      decisionId: row.decisionId,
      attemptNumber: row.attemptNumber,
      status: row.status as ActionExecutionStatus,
      mode: row.mode as ActionExecutionMode,
      executedBy: row.executedBy as any,
      result: row.result as any,
      error: row.error,
      dispatchedAt: row.dispatchedAt,
      completedAt: row.completedAt,
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateStatus(
    id: string,
    status: ActionExecutionStatus,
    updateData?: {
      result?: Record<string, unknown> | null;
      error?: string | null;
      dispatchedAt?: Date | string | null;
      completedAt?: Date | string | null;
      metadata?: Record<string, unknown>;
    },
    expectedCurrentStatus?: ActionExecutionStatus,
    tx?: any
  ): Promise<boolean> {
    const client = tx || this.prisma;
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    const whereClause: any = {
      tenantId: this.tenantId,
      id,
    };

    if (expectedCurrentStatus) {
      whereClause.status = expectedCurrentStatus;
    }

    const updatePayload: any = {
      status,
      metadata: {
        ...(existing.metadata as any),
        ...(updateData?.metadata || {}),
      },
    };

    if (updateData?.result !== undefined) updatePayload.result = updateData.result;
    if (updateData?.error !== undefined) updatePayload.error = updateData.error;
    if (updateData?.dispatchedAt !== undefined) {
      updatePayload.dispatchedAt = updateData.dispatchedAt ? new Date(updateData.dispatchedAt) : null;
    }
    if (updateData?.completedAt !== undefined) {
      updatePayload.completedAt = updateData.completedAt ? new Date(updateData.completedAt) : null;
    }

    const res = await (client as any).actionExecutionRecord.updateMany({
      where: whereClause,
      data: updatePayload,
    });

    return (res?.count ?? 0) > 0;
  }

  async listByProposal(proposalId: string): Promise<ActionExecutionRecord[]> {
    const rows = await (this.prisma as any).actionExecutionRecord.findMany({
      where: {
        tenantId: this.tenantId,
        proposalId,
      },
      orderBy: { attemptNumber: 'asc' },
    });

    return rows.map((row: any) => ({
      tenantId: row.tenantId,
      id: row.id,
      proposalId: row.proposalId,
      decisionId: row.decisionId,
      attemptNumber: row.attemptNumber,
      status: row.status as ActionExecutionStatus,
      mode: row.mode as ActionExecutionMode,
      executedBy: row.executedBy as any,
      result: row.result as any,
      error: row.error,
      dispatchedAt: row.dispatchedAt,
      completedAt: row.completedAt,
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getLatestAttemptNumber(proposalId: string): Promise<number> {
    const list = await this.listByProposal(proposalId);
    if (list.length === 0) return 0;
    return Math.max(...list.map((e) => e.attemptNumber));
  }

  async count(): Promise<number> {
    return await (this.prisma as any).actionExecutionRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });
  }

  async clear(): Promise<void> {
    await (this.prisma as any).actionExecutionRecord.deleteMany({
      where: {
        tenantId: this.tenantId,
      },
    });
  }
}
