import { ActionExecutionRecord, ActionExecutionStatus } from './ActionExecutionRecord';

export interface IActionExecutionRepository {
  /**
   * Armazena ou cria uma nova execução de ação no tenant.
   */
  store(execution: ActionExecutionRecord): Promise<void>;

  /**
   * Busca uma execução por seu ID no escopo do tenant.
   */
  findById(id: string): Promise<ActionExecutionRecord | null>;

  /**
   * Busca uma execução específica por proposalId e attemptNumber no tenant.
   */
  findByAttempt(proposalId: string, attemptNumber: number): Promise<ActionExecutionRecord | null>;

  /**
   * Atualiza atomicamente o status e dados de resultado de uma execução.
   */
  updateStatus(
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
  ): Promise<boolean>;

  /**
   * Lista o histórico de todas as tentativas de execução vinculadas a uma proposta, ordenadas por tentativa.
   */
  listByProposal(proposalId: string): Promise<ActionExecutionRecord[]>;

  /**
   * Obtém o número da última tentativa registrada para uma proposta (retorna 0 se nenhuma).
   */
  getLatestAttemptNumber(proposalId: string): Promise<number>;

  /**
   * Conta o total de execuções no tenant.
   */
  count(): Promise<number>;

  /**
   * Limpa execuções do tenant (utilizado em testes).
   */
  clear(): Promise<void>;
}
