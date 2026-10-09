import { ActionProposalRecord, ActionProposalStatus } from './ActionProposalRecord';

export interface IActionProposalRepository {
  /**
   * Armazena uma proposta de ação de forma idempotente.
   * IMPORTANTE: Se a proposta já existir, campos de estado crítico (ex: AUTHORIZED, REJECTED)
   * e dados existentes NÃO devem ser regredidos para PROPOSED.
   */
  store(proposal: ActionProposalRecord): Promise<void>;

  /**
   * Armazena múltiplas propostas de ação respeitando a preservação de estado existente.
   */
  storeMany(proposals: ActionProposalRecord[]): Promise<void>;

  /**
   * Busca uma proposta pelo ID no escopo estrito do tenant.
   */
  find(id: string): Promise<ActionProposalRecord | null>;

  /**
   * Atualiza exclusivamente o status da proposta no tenant com suporte a verificação atômica de estado esperado.
   * Se expectedCurrentStatus for informado, a transição só ocorre se o status atual for igual a ele.
   */
  updateStatus(
    id: string,
    status: ActionProposalStatus,
    metadataUpdate?: Record<string, unknown>,
    expectedCurrentStatus?: ActionProposalStatus,
    tx?: any
  ): Promise<boolean>;

  /**
   * Lista todas as propostas vinculadas a uma decisão específica dentro do tenant.
   */
  listByDecision(decisionId: string): Promise<ActionProposalRecord[]>;

  /**
   * Lista todas as propostas do tenant.
   */
  list(): Promise<ActionProposalRecord[]>;

  /**
   * Conta a quantidade total de propostas do tenant.
   */
  count(): Promise<number>;

  /**
   * Limpa as propostas do tenant (utilizado em testes).
   */
  clear(): Promise<void>;
}
