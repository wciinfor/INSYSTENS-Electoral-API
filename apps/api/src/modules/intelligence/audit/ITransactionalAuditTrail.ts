import { IDecisionAuditTrail, DecisionAuditEvent } from './IDecisionAuditTrail';

export interface ITransactionalAuditTrail extends IDecisionAuditTrail {
  /**
   * Registra um evento imutável de auditoria dentro de um cliente transacional específico (ex: Prisma.TransactionClient).
   * Se a gravação falhar, todo o bloco transacional sofre rollback físico no banco de dados.
   */
  recordInTransaction(tx: any, event: DecisionAuditEvent): Promise<void>;
}
