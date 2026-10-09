import { ActorContext } from '../security/ActorContext';
import { DecisionOperation } from '../security/PolicyGuard';

export interface DecisionAuditEvent {
  id?: string;
  tenantId: string;
  actorId: string;
  actorType: string;
  decisionId: string;
  operation: DecisionOperation | string;
  result: 'ALLOWED' | 'DENIED' | 'SUCCESS' | 'FAILED';
  reason?: string;
  source?: string;
  decisionCategory?: string;
  decisionPriority?: string;
  relatedSignals?: string[];
  details?: Record<string, unknown>;
  timestamp?: Date | string;
}

export interface IDecisionAuditTrail {
  /**
   * Registra um evento imutável de auditoria.
   */
  record(event: DecisionAuditEvent): Promise<void>;

  /**
   * Registra múltiplos eventos imutáveis de auditoria.
   */
  recordMany(events: DecisionAuditEvent[]): Promise<void>;

  /**
   * Lista eventos de auditoria filtrados estritamente pelo tenant.
   */
  listByTenant(tenantId: string): Promise<DecisionAuditEvent[]>;

  /**
   * Lista eventos de auditoria de uma decisão específica dentro do tenant.
   */
  listByDecision(tenantId: string, decisionId: string): Promise<DecisionAuditEvent[]>;

  /**
   * Conta a quantidade total de eventos de auditoria de um tenant.
   */
  count(tenantId: string): Promise<number>;

  /**
   * Limpa os eventos de um tenant (utilizado para testes).
   */
  clear(tenantId: string): Promise<void>;
}
