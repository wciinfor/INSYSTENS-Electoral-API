import { ActionExecutionRecord, ActionExecutionStatus } from '../domain/ActionExecutionRecord';
import { IActionExecutionRepository } from '../domain/IActionExecutionRepository';

export class InMemoryActionExecutionRepository implements IActionExecutionRepository {
  private executions = new Map<string, ActionExecutionRecord>();

  constructor(private readonly tenantId: string) {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('InMemoryActionExecutionRepository: tenantId é obrigatório e não pode ser vazio.');
    }
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  private getKey(id: string): string {
    return `${this.tenantId}:${id}`;
  }

  async store(execution: ActionExecutionRecord): Promise<void> {
    if (execution.tenantId !== this.tenantId) {
      return;
    }

    // Valida unicidade de [tenantId, proposalId, attemptNumber]
    for (const existing of this.executions.values()) {
      if (
        existing.proposalId === execution.proposalId &&
        existing.attemptNumber === execution.attemptNumber &&
        existing.id !== execution.id
      ) {
        throw new Error(
          `Unique constraint failed: execução para proposta '${execution.proposalId}' tentativa ${execution.attemptNumber} já existe no tenant '${this.tenantId}'.`
        );
      }
    }

    const key = this.getKey(execution.id);
    this.executions.set(key, {
      ...execution,
      executedBy: { ...execution.executedBy },
      result: execution.result ? { ...execution.result } : null,
      metadata: { ...execution.metadata },
    });
  }

  async findById(id: string): Promise<ActionExecutionRecord | null> {
    const item = this.executions.get(this.getKey(id));
    if (!item) return null;
    return {
      ...item,
      executedBy: { ...item.executedBy },
      result: item.result ? { ...item.result } : null,
      metadata: { ...item.metadata },
    };
  }

  async findByAttempt(proposalId: string, attemptNumber: number): Promise<ActionExecutionRecord | null> {
    for (const item of this.executions.values()) {
      if (item.proposalId === proposalId && item.attemptNumber === attemptNumber) {
        return {
          ...item,
          executedBy: { ...item.executedBy },
          result: item.result ? { ...item.result } : null,
          metadata: { ...item.metadata },
        };
      }
    }
    return null;
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
    expectedCurrentStatus?: ActionExecutionStatus
  ): Promise<boolean> {
    const key = this.getKey(id);
    const existing = this.executions.get(key);
    if (!existing) {
      return false;
    }

    if (expectedCurrentStatus && existing.status !== expectedCurrentStatus) {
      return false;
    }

    this.executions.set(key, {
      ...existing,
      status,
      result: updateData?.result !== undefined ? updateData.result : existing.result,
      error: updateData?.error !== undefined ? updateData.error : existing.error,
      dispatchedAt: updateData?.dispatchedAt !== undefined ? updateData.dispatchedAt : existing.dispatchedAt,
      completedAt: updateData?.completedAt !== undefined ? updateData.completedAt : existing.completedAt,
      metadata: { ...existing.metadata, ...(updateData?.metadata || {}) },
      updatedAt: new Date().toISOString(),
    });

    return true;
  }

  async listByProposal(proposalId: string): Promise<ActionExecutionRecord[]> {
    return Array.from(this.executions.values())
      .filter((e) => e.proposalId === proposalId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber)
      .map((item) => ({
        ...item,
        executedBy: { ...item.executedBy },
        result: item.result ? { ...item.result } : null,
        metadata: { ...item.metadata },
      }));
  }

  async getLatestAttemptNumber(proposalId: string): Promise<number> {
    const list = await this.listByProposal(proposalId);
    if (list.length === 0) return 0;
    return Math.max(...list.map((e) => e.attemptNumber));
  }

  async count(): Promise<number> {
    return this.executions.size;
  }

  async clear(): Promise<void> {
    this.executions.clear();
  }
}
