import { DecisionRecord } from './DecisionRecord';

export interface IDecisionRepository {
  /**
   * Armazena uma decisão de forma idempotente por (tenantId, id).
   */
  store(decision: DecisionRecord): Promise<void>;

  /**
   * Armazena múltiplas decisões de forma determinística e idempotente.
   */
  storeMany(decisions: DecisionRecord[]): Promise<void>;

  /**
   * Busca uma decisão pelo ID no escopo estrito do tenant.
   */
  find(id: string): Promise<DecisionRecord | null>;

  /**
   * Busca uma decisão pelo ID no escopo estrito do tenant (alias para find).
   */
  getById(id: string): Promise<DecisionRecord | null>;

  /**
   * Verifica se uma decisão existe no tenant.
   */
  exists(id: string): Promise<boolean>;

  /**
   * Lista todas as decisões pertencentes ao tenant.
   */
  list(): Promise<DecisionRecord[]>;

  /**
   * Retorna a quantidade total de decisões pertencentes ao tenant.
   */
  count(): Promise<number>;

  /**
   * Remove todas as decisões do tenant (útil para limpeza em testes).
   */
  clear(): Promise<void>;
}
