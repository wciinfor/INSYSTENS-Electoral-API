import { Decision as CoreDecision } from '../../../core/decisions/Decision';
import { DecisionRecord } from '../domain/DecisionRecord';
import { IDecisionRepository } from '../domain/IDecisionRepository';
import { IDecisionAuditTrail } from '../audit/IDecisionAuditTrail';
import { ActorContext } from '../security/ActorContext';
import { DecisionOperation, PolicyGuard } from '../security/PolicyGuard';

export interface DecisionRegistryOptions {
  repository: IDecisionRepository;
  tenantId: string;
  auditTrail?: IDecisionAuditTrail;
}

export class DecisionRegistry {
  private readonly repository: IDecisionRepository;
  private readonly tenantId: string;
  private readonly auditTrail?: IDecisionAuditTrail;

  constructor(options: DecisionRegistryOptions) {
    if (!options || !options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim() === '') {
      throw new Error('DecisionRegistry: tenantId é obrigatório e não pode ser vazio.');
    }
    if (!options.repository) {
      throw new Error('DecisionRegistry: repository é obrigatório.');
    }
    this.tenantId = options.tenantId;
    this.repository = options.repository;
    this.auditTrail = options.auditTrail;
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  get currentRepository(): IDecisionRepository {
    return this.repository;
  }

  /**
   * Converte uma CoreDecision em DecisionRecord determinístico.
   * Não altera o Core e preserva 100% dos dados gerados pelo DecisionEngine.
   */
  toRecord(decision: CoreDecision): DecisionRecord {
    return {
      tenantId: this.tenantId,
      id: decision.id,
      category: decision.category,
      priority: decision.priority,
      title: decision.title,
      summary: decision.summary,
      expectedImpact: decision.expectedImpact,
      confidence: decision.confidence,
      reasons: decision.reasons ? [...decision.reasons] : [],
      recommendedActions: decision.recommendedActions ? [...decision.recommendedActions] : [],
      relatedSignals: decision.relatedSignals ? [...decision.relatedSignals] : [],
      metadata: {
        ...(decision.metadata || {}),
        source: 'DecisionEngine',
        version: '1.0.0',
      },
      createdAt: decision.generatedAt || new Date().toISOString(),
    };
  }

  /**
   * Registra e persiste uma única decisão do Core.
   * Fluxo estrito: PolicyGuard -> (ALLOW) -> Repositório -> AuditTrail.
   * Se o PolicyGuard negar, registra evento DENIED no AuditTrail e lança erro sem persistir.
   */
  async register(decision: CoreDecision, actor?: ActorContext): Promise<DecisionRecord> {
    const record = this.toRecord(decision);

    // 1. Verificação de PolicyGuard quando o ator é informado
    if (actor) {
      const evaluation = PolicyGuard.evaluate(actor, DecisionOperation.DECISION_REGISTER, {
        tenantId: this.tenantId,
        decisionId: record.id,
        category: record.category,
        priority: record.priority,
      });

      if (!evaluation.allowed) {
        if (this.auditTrail) {
          // Registra o evento de auditoria no tenant do ator que tentou a operação indevida
          const auditTenantId = actor.tenantId || this.tenantId;
          await this.auditTrail.record({
            tenantId: auditTenantId,
            actorId: actor.actorId,
            actorType: actor.actorType,
            decisionId: record.id,
            operation: DecisionOperation.DECISION_REGISTER,
            result: 'DENIED',
            reason: evaluation.reason || 'Operação negada pelo PolicyGuard.',
            source: 'DecisionRegistry',
            decisionCategory: record.category,
            decisionPriority: record.priority,
            relatedSignals: record.relatedSignals,
          });
        }
        throw new Error(`DecisionRegistry: Operação negada pelo PolicyGuard. ${evaluation.reason}`);
      }
    }

    // 2. Persistência somente após validação positiva
    await this.repository.store(record);

    // 3. Auditoria de sucesso
    if (this.auditTrail) {
      await this.auditTrail.record({
        tenantId: this.tenantId,
        actorId: actor?.actorId || 'system',
        actorType: actor?.actorType || 'SYSTEM',
        decisionId: record.id,
        operation: DecisionOperation.DECISION_REGISTER,
        result: 'SUCCESS',
        reason: 'Decisão persistida com sucesso via DecisionRegistry.',
        source: 'DecisionRegistry',
        decisionCategory: record.category,
        decisionPriority: record.priority,
        relatedSignals: record.relatedSignals,
      });
    }

    return record;
  }

  /**
   * Registra e persiste em lote uma coleção de decisões produzidas pelo DecisionEngine.
   */
  async registerMany(decisions: CoreDecision[], actor?: ActorContext): Promise<DecisionRecord[]> {
    if (!decisions || decisions.length === 0) {
      return [];
    }
    const records = decisions.map((d) => this.toRecord(d));

    // 1. Verificação de PolicyGuard
    if (actor) {
      for (const record of records) {
        const evaluation = PolicyGuard.evaluate(actor, DecisionOperation.DECISION_REGISTER, {
          tenantId: this.tenantId,
          decisionId: record.id,
          category: record.category,
          priority: record.priority,
        });

        if (!evaluation.allowed) {
          if (this.auditTrail) {
            const auditTenantId = actor.tenantId || this.tenantId;
            await this.auditTrail.record({
              tenantId: auditTenantId,
              actorId: actor.actorId,
              actorType: actor.actorType,
              decisionId: record.id,
              operation: DecisionOperation.DECISION_REGISTER,
              result: 'DENIED',
              reason: evaluation.reason || 'Operação negada pelo PolicyGuard em lote.',
              source: 'DecisionRegistry',
              decisionCategory: record.category,
              decisionPriority: record.priority,
              relatedSignals: record.relatedSignals,
            });
          }
          throw new Error(`DecisionRegistry: Operação em lote negada pelo PolicyGuard. ${evaluation.reason}`);
        }
      }
    }

    // 2. Persistência
    await this.repository.storeMany(records);

    // 3. Auditoria
    if (this.auditTrail) {
      const auditEvents = records.map((record) => ({
        tenantId: this.tenantId,
        actorId: actor?.actorId || 'system',
        actorType: actor?.actorType || 'SYSTEM',
        decisionId: record.id,
        operation: DecisionOperation.DECISION_REGISTER,
        result: 'SUCCESS' as const,
        reason: 'Decisão em lote persistida com sucesso via DecisionRegistry.',
        source: 'DecisionRegistry',
        decisionCategory: record.category,
        decisionPriority: record.priority,
        relatedSignals: record.relatedSignals,
      }));
      await this.auditTrail.recordMany(auditEvents);
    }

    return records;
  }

  /**
   * Busca uma decisão pelo ID no escopo do tenant atual.
   */
  async getById(id: string): Promise<DecisionRecord | null> {
    return await this.repository.find(id);
  }

  /**
   * Lista todas as decisões persistidas para o tenant atual.
   */
  async list(): Promise<DecisionRecord[]> {
    return await this.repository.list();
  }

  /**
   * Conta a quantidade de decisões para o tenant atual.
   */
  async count(): Promise<number> {
    return await this.repository.count();
  }
}
