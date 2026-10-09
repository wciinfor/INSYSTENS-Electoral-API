import { ActionProposalRecord, ActionProposalStatus } from '../domain/ActionProposalRecord';
import { IActionProposalRepository } from '../domain/IActionProposalRepository';

export class InMemoryActionProposalRepository implements IActionProposalRepository {
  private proposals = new Map<string, ActionProposalRecord>();

  constructor(private readonly tenantId: string) {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('InMemoryActionProposalRepository: tenantId é obrigatório e não pode ser vazio.');
    }
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  private getKey(id: string): string {
    return `${this.tenantId}:${id}`;
  }

  async store(proposal: ActionProposalRecord): Promise<void> {
    if (proposal.tenantId !== this.tenantId) {
      return;
    }

    const key = this.getKey(proposal.id);
    const existing = this.proposals.get(key);

    if (existing) {
      // REGRA DE OURO: Preservar status existente se já tiver avançado (AUTHORIZED, REJECTED, CANCELLED)
      // Não regredir status para PROPOSED!
      const preservedStatus: ActionProposalStatus =
        existing.status !== 'PROPOSED' ? existing.status : proposal.status;

      this.proposals.set(key, {
        ...proposal,
        status: preservedStatus,
        metadata: { ...existing.metadata, ...proposal.metadata },
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      });
    } else {
      this.proposals.set(key, {
        ...proposal,
        metadata: { ...proposal.metadata },
        createdAt: proposal.createdAt || new Date().toISOString(),
        updatedAt: proposal.updatedAt || new Date().toISOString(),
      });
    }
  }

  /**
   * Armazena múltiplas propostas de ação sequencialmente em memória.
   * NOTA: Este adaptador em memória NÃO oferece isolamento transacional ACID/rollback;
   * em caso de exceção no meio do array, as inserções prévias permanecem no Map.
   * Para garantias ACID/rollback atômico, utilize o adaptador PrismaActionProposalRepository.
   */
  async storeMany(proposals: ActionProposalRecord[]): Promise<void> {
    for (const p of proposals) {
      await this.store(p);
    }
  }

  async find(id: string): Promise<ActionProposalRecord | null> {
    const item = this.proposals.get(this.getKey(id));
    if (!item) return null;
    return {
      ...item,
      metadata: { ...item.metadata },
    };
  }

  async updateStatus(
    id: string,
    status: ActionProposalStatus,
    metadataUpdate?: Record<string, unknown>,
    expectedCurrentStatus?: ActionProposalStatus
  ): Promise<boolean> {
    const key = this.getKey(id);
    const existing = this.proposals.get(key);
    if (!existing) {
      return false;
    }

    if (expectedCurrentStatus && existing.status !== expectedCurrentStatus) {
      return false;
    }

    this.proposals.set(key, {
      ...existing,
      status,
      metadata: { ...existing.metadata, ...(metadataUpdate || {}) },
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  async listByDecision(decisionId: string): Promise<ActionProposalRecord[]> {
    return Array.from(this.proposals.values())
      .filter((p) => p.decisionId === decisionId)
      .map((p) => ({ ...p, metadata: { ...p.metadata } }));
  }

  async list(): Promise<ActionProposalRecord[]> {
    return Array.from(this.proposals.values()).map((p) => ({
      ...p,
      metadata: { ...p.metadata },
    }));
  }

  async count(): Promise<number> {
    return this.proposals.size;
  }

  async clear(): Promise<void> {
    this.proposals.clear();
  }
}
