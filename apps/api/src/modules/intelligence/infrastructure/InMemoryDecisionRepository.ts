import { DecisionRecord } from '../domain/DecisionRecord';
import { IDecisionRepository } from '../domain/IDecisionRepository';

export class InMemoryDecisionRepository implements IDecisionRepository {
  private decisions = new Map<string, DecisionRecord>();

  constructor(private readonly tenantId: string) {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('InMemoryDecisionRepository: tenantId é obrigatório e não pode ser vazio.');
    }
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  private getKey(id: string): string {
    return `${this.tenantId}:${id}`;
  }

  async store(decision: DecisionRecord): Promise<void> {
    if (decision.tenantId !== this.tenantId) {
      return;
    }
    this.decisions.set(this.getKey(decision.id), {
      ...decision,
      reasons: decision.reasons ? [...decision.reasons] : [],
      recommendedActions: decision.recommendedActions ? [...decision.recommendedActions] : [],
      relatedSignals: decision.relatedSignals ? [...decision.relatedSignals] : [],
      metadata: { ...decision.metadata },
    });
  }

  async storeMany(decisions: DecisionRecord[]): Promise<void> {
    for (const d of decisions) {
      await this.store(d);
    }
  }

  async find(id: string): Promise<DecisionRecord | null> {
    const item = this.decisions.get(this.getKey(id));
    if (!item) return null;
    return {
      ...item,
      reasons: item.reasons ? [...item.reasons] : [],
      recommendedActions: item.recommendedActions ? [...item.recommendedActions] : [],
      relatedSignals: item.relatedSignals ? [...item.relatedSignals] : [],
      metadata: { ...item.metadata },
    };
  }

  async getById(id: string): Promise<DecisionRecord | null> {
    return this.find(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.decisions.has(this.getKey(id));
  }

  async list(): Promise<DecisionRecord[]> {
    return Array.from(this.decisions.values()).map((item) => ({
      ...item,
      reasons: item.reasons ? [...item.reasons] : [],
      recommendedActions: item.recommendedActions ? [...item.recommendedActions] : [],
      relatedSignals: item.relatedSignals ? [...item.relatedSignals] : [],
      metadata: { ...item.metadata },
    }));
  }

  async count(): Promise<number> {
    return this.decisions.size;
  }

  async clear(): Promise<void> {
    this.decisions.clear();
  }
}
