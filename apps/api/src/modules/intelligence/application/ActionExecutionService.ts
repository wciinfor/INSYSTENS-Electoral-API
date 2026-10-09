import { ActorContext } from '../security/ActorContext';
import { IActionProposalRepository } from '../domain/IActionProposalRepository';
import { ActionProposalStatus } from '../domain/ActionProposalRecord';
import { IActionExecutionRepository } from '../domain/IActionExecutionRepository';
import {
  ActionExecutionRecord,
  ActionExecutionStatus,
  ActionExecutionMode,
} from '../domain/ActionExecutionRecord';
import { IDecisionAuditTrail } from '../audit/IDecisionAuditTrail';

export interface ActionExecutionServiceOptions {
  proposalRepository: IActionProposalRepository;
  executionRepository: IActionExecutionRepository;
  tenantId: string;
  auditTrail?: IDecisionAuditTrail;
}

export interface DispatchExecutionParams {
  proposalId: string;
  actor: ActorContext;
  mode?: ActionExecutionMode; // Padrão: SIMULATED
  payload?: Record<string, unknown>;
}

export interface CompleteExecutionParams {
  executionId: string;
  actor: ActorContext;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export class ActionExecutionService {
  private readonly proposalRepository: IActionProposalRepository;
  private readonly executionRepository: IActionExecutionRepository;
  private readonly tenantId: string;
  private readonly auditTrail?: IDecisionAuditTrail;

  constructor(options: ActionExecutionServiceOptions) {
    if (!options || !options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim() === '') {
      throw new Error('ActionExecutionService: tenantId é obrigatório e não pode ser vazio.');
    }
    if (!options.proposalRepository) {
      throw new Error('ActionExecutionService: proposalRepository é obrigatório.');
    }
    if (!options.executionRepository) {
      throw new Error('ActionExecutionService: executionRepository é obrigatório.');
    }
    this.tenantId = options.tenantId;
    this.proposalRepository = options.proposalRepository;
    this.executionRepository = options.executionRepository;
    this.auditTrail = options.auditTrail;
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  /**
   * Valida identidade básica do ator e coerência multi-tenant.
   */
  private validateActor(actor: ActorContext): void {
    if (!actor || !actor.actorId || typeof actor.actorId !== 'string' || actor.actorId.trim() === '') {
      throw new Error('ActionExecutionService: Ator inválido ou sem actorId informado.');
    }
    if (!actor.tenantId || actor.tenantId !== this.tenantId) {
      throw new Error(`ActionExecutionService: Violação de isolamento multi-tenant: Ator do tenant '${actor?.tenantId}' tentou executar ação no tenant '${this.tenantId}'.`);
    }
  }

  /**
   * DISPACHA uma execução para uma proposta de ação:
   * REGRA CENTRAL: Proposta DEVE estar previamente em status AUTHORIZED.
   * Cria uma nova tentativa com attemptNumber = latestAttemptNumber + 1.
   * Transição: Criação em status PENDING -> Imediatamente DISPATCHED (modo simulado controlado).
   */
  async dispatch(params: DispatchExecutionParams): Promise<ActionExecutionRecord> {
    const { proposalId, actor, mode = ActionExecutionMode.SIMULATED, payload } = params;

    this.validateActor(actor);

    // 1. Busca proposta no repositório
    const proposal = await this.proposalRepository.find(proposalId);
    if (!proposal) {
      throw new Error(`ActionExecutionService: Proposta '${proposalId}' não encontrada no tenant '${this.tenantId}'.`);
    }

    // 2. Trava Inviolável: Proposta DEVE estar em AUTHORIZED
    if (proposal.status !== ActionProposalStatus.AUTHORIZED) {
      throw new Error(
        `ActionExecutionService: Proposta '${proposalId}' não pode ser despachada pois seu status é '${proposal.status}' (requer AUTHORIZED por autorização humana prévia).`
      );
    }

    // 3. Alocação de tentativa com Retry Limitado contra colisão concorrente (P2002)
    const MAX_RETRIES = 3;
    let executionRecord: ActionExecutionRecord | null = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const latestAttempt = await this.executionRepository.getLatestAttemptNumber(proposalId);
      const nextAttempt = latestAttempt + 1;
      const executionId = `exec-${proposal.id}-att${nextAttempt}`;
      const now = new Date().toISOString();

      const candidateRecord: ActionExecutionRecord = {
        tenantId: this.tenantId,
        id: executionId,
        proposalId: proposal.id,
        decisionId: proposal.decisionId,
        attemptNumber: nextAttempt,
        status: ActionExecutionStatus.DISPATCHED,
        mode,
        executedBy: {
          actorId: actor.actorId,
          actorType: actor.actorType,
          tenantId: actor.tenantId,
        },
        result: null,
        error: null,
        dispatchedAt: now,
        completedAt: null,
        metadata: {
          payload: payload || {},
          simulated: mode === ActionExecutionMode.SIMULATED,
          decisionCategory: proposal.category,
          actionPriority: proposal.priority,
        },
        createdAt: now,
        updatedAt: now,
      };

      const isPrismaRepo = typeof (this.executionRepository as any).getPrismaClient === 'function';
      const hasTxAudit = this.auditTrail && typeof (this.auditTrail as any).recordInTransaction === 'function';

      const auditEvent = {
        tenantId: this.tenantId,
        actorId: actor.actorId,
        actorType: actor.actorType,
        decisionId: proposal.decisionId,
        operation: 'ACTION_EXECUTION_DISPATCH',
        result: 'SUCCESS' as const,
        reason: `Tentativa ${candidateRecord.attemptNumber} despachada em modo ${mode}.`,
        source: 'ActionExecutionService',
        details: {
          executionId: candidateRecord.id,
          proposalId: proposal.id,
          attemptNumber: candidateRecord.attemptNumber,
          mode,
        },
        timestamp: candidateRecord.dispatchedAt || new Date().toISOString(),
      };

      try {
        if (isPrismaRepo && hasTxAudit) {
          const prismaClient = (this.executionRepository as any).getPrismaClient();
          await prismaClient.$transaction(async (tx: any) => {
            await (this.executionRepository as any).store(candidateRecord, tx);
            await (this.auditTrail as any).recordInTransaction(tx, auditEvent);
          });
        } else {
          // Bloqueia fallback não transacional se a persistência for relacional/Prisma
          if (isPrismaRepo && this.auditTrail) {
            throw new Error(
              'ActionExecutionService: Configuração inválida. Repositório relacional exige ITransactionalAuditTrail para garantir atomicidade.'
            );
          }
          await this.executionRepository.store(candidateRecord);
          if (this.auditTrail) {
            await this.auditTrail.record(auditEvent);
          }
        }
        executionRecord = candidateRecord;
        break; // Persistência e auditoria atômicas bem-sucedidas
      } catch (err: any) {
        lastError = err;
        const isConflict =
          err?.code === 'P2002' ||
          (err?.message && (err.message.includes('Unique constraint') || err.message.includes('unique')));
        if (!isConflict) {
          throw err;
        }
        // Em caso de colisão concorrente no attemptNumber/id, tenta novamente no loop
      }
    }

    if (!executionRecord) {
      throw new Error(
        `ActionExecutionService: Falha ao despachar tentativa de execução para a proposta '${proposalId}' após ${MAX_RETRIES} tentativas concorrentes. Detalhes: ${lastError?.message || lastError}`
      );
    }

    return executionRecord;
  }

  /**
   * CONCLUI uma execução simulada ou manual (EXECUTED ou FAILED):
   * Transição permitida: DISPATCHED -> EXECUTED ou DISPATCHED -> FAILED.
   * Bloqueia transições repetidas em execuções já finalizadas.
   */
  async complete(params: CompleteExecutionParams): Promise<ActionExecutionRecord> {
    const { executionId, actor, success, result, error } = params;

    this.validateActor(actor);

    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error(`ActionExecutionService: Execução '${executionId}' não encontrada no tenant '${this.tenantId}'.`);
    }

    // Validação de estado atual: deve estar em DISPATCHED (ou PENDING)
    if (execution.status !== ActionExecutionStatus.DISPATCHED && execution.status !== ActionExecutionStatus.PENDING) {
      throw new Error(
        `ActionExecutionService: Execução '${executionId}' não pode ser concluída pois já está em status '${execution.status}'.`
      );
    }

    const nextStatus = success ? ActionExecutionStatus.EXECUTED : ActionExecutionStatus.FAILED;
    const now = new Date().toISOString();

    const auditEvent = {
      tenantId: this.tenantId,
      actorId: actor.actorId,
      actorType: actor.actorType,
      decisionId: execution.decisionId,
      operation: success ? 'ACTION_EXECUTION_SUCCESS' : 'ACTION_EXECUTION_FAILURE',
      result: success ? ('SUCCESS' as const) : ('FAILED' as const),
      reason: success ? 'Execução concluída com sucesso.' : error || 'Execução falhou.',
      source: 'ActionExecutionService',
      details: {
        executionId,
        proposalId: execution.proposalId,
        attemptNumber: execution.attemptNumber,
      },
      timestamp: now,
    };

    const isPrismaRepo = typeof (this.executionRepository as any).getPrismaClient === 'function';
    const hasTxAudit = this.auditTrail && typeof (this.auditTrail as any).recordInTransaction === 'function';

    const updatePayload = {
      result: success ? result || { success: true } : null,
      error: !success ? error || 'Erro de execução reportado.' : null,
      completedAt: now,
      metadata: {
        completedBy: {
          actorId: actor.actorId,
          actorType: actor.actorType,
        },
      },
    };

    if (isPrismaRepo && hasTxAudit) {
      const prismaClient = (this.executionRepository as any).getPrismaClient();
      await prismaClient.$transaction(async (tx: any) => {
        const updated = await (this.executionRepository as any).updateStatus(
          executionId,
          nextStatus,
          updatePayload,
          execution.status,
          tx
        );

        if (!updated) {
          throw new Error(`ActionExecutionService: Falha atômica ao concluir execução '${executionId}'.`);
        }

        await (this.auditTrail as any).recordInTransaction(tx, auditEvent);
      });
    } else {
      // Bloqueia fallback não transacional se a persistência for relacional/Prisma
      if (isPrismaRepo && this.auditTrail) {
        throw new Error(
          'ActionExecutionService: Configuração inválida. Repositório relacional exige ITransactionalAuditTrail para garantir atomicidade.'
        );
      }

      const updated = await this.executionRepository.updateStatus(
        executionId,
        nextStatus,
        updatePayload,
        execution.status
      );

      if (!updated) {
        throw new Error(`ActionExecutionService: Falha atômica ao concluir execução '${executionId}'.`);
      }

      if (this.auditTrail) {
        await this.auditTrail.record(auditEvent);
      }
    }

    return (await this.executionRepository.findById(executionId))!;
  }

  /**
   * Recupera o histórico completo de tentativas de execução de uma proposta.
   */
  async getHistory(proposalId: string): Promise<ActionExecutionRecord[]> {
    return this.executionRepository.listByProposal(proposalId);
  }
}
