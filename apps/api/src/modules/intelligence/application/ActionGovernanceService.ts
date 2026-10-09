import { ActorContext } from '../security/ActorContext';
import { PolicyGuard } from '../security/PolicyGuard';
import { IDecisionAuditTrail } from '../audit/IDecisionAuditTrail';
import { IActionProposalRepository } from '../domain/IActionProposalRepository';
import { ActionProposalRecord, ActionProposalStatus } from '../domain/ActionProposalRecord';

export const ActionGovernanceOperation = {
  ACTION_AUTHORIZE: 'ACTION_AUTHORIZE' as const,
  ACTION_REJECT: 'ACTION_REJECT' as const,
};

export type ActionGovernanceOperation =
  typeof ActionGovernanceOperation[keyof typeof ActionGovernanceOperation];

export interface ActionGovernanceServiceOptions {
  repository: IActionProposalRepository;
  tenantId: string;
  auditTrail?: IDecisionAuditTrail;
}

export interface AuthorizeActionParams {
  proposalId: string;
  actor: ActorContext;
  notes?: string;
}

export interface RejectActionParams {
  proposalId: string;
  actor: ActorContext;
  reason: string;
}

export class ActionGovernanceService {
  private readonly repository: IActionProposalRepository;
  private readonly tenantId: string;
  private readonly auditTrail?: IDecisionAuditTrail;

  constructor(options: ActionGovernanceServiceOptions) {
    if (!options || !options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim() === '') {
      throw new Error('ActionGovernanceService: tenantId é obrigatório e não pode ser vazio.');
    }
    if (!options.repository) {
      throw new Error('ActionGovernanceService: repository é obrigatório.');
    }
    this.tenantId = options.tenantId;
    this.repository = options.repository;
    this.auditTrail = options.auditTrail;
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  /**
   * Validação estrita de ator humano autenticado:
   * 1. Rejeita actorType 'SYSTEM' (apenas humanos podem autorizar/rejeitar propostas).
   * 2. Rejeita atores sem actorId ou tenantId.
   */
  private validateHumanActor(actor: ActorContext): void {
    if (!actor || !actor.actorId || typeof actor.actorId !== 'string' || actor.actorId.trim() === '') {
      throw new Error('ActionGovernanceService: Ator inválido ou sem actorId informado.');
    }
    if (!actor.tenantId || typeof actor.tenantId !== 'string' || actor.tenantId.trim() === '') {
      throw new Error('ActionGovernanceService: Ator inválido ou sem tenantId informado.');
    }
    if (String(actor.actorType || '').toUpperCase() === 'SYSTEM') {
      throw new Error('ActionGovernanceService: Atores do tipo SYSTEM não possuem permissão para governança humana de ações.');
    }
  }

  /**
   * Avalia a política de segurança via PolicyGuard e validação de capabilities explícitas:
   * Requer capability 'action:authorize' ou 'action:reject' (ou wildcard '*' / 'action:*').
   */
  private evaluatePolicy(
    actor: ActorContext,
    operation: ActionGovernanceOperation,
    proposal: ActionProposalRecord
  ): { allowed: boolean; reason?: string; code?: string } {
    // 1. Isolamento multi-tenant primário via PolicyGuard
    // Passamos o ator sem capabilities para a avaliação de tenant/ator do PolicyGuard,
    // garantindo zero modificação no Sprint 6 congelado
    const actorForTenantCheck: ActorContext = {
      tenantId: actor.tenantId,
      actorId: actor.actorId,
      actorType: actor.actorType,
    };

    const guardResult = PolicyGuard.evaluate(actorForTenantCheck, operation, {
      tenantId: this.tenantId,
      decisionId: proposal.decisionId,
      category: proposal.category,
      priority: proposal.priority,
    });

    if (!guardResult.allowed) {
      return guardResult;
    }

    // 2. Validação obrigatória de capabilities específicas para ações (action:authorize / action:reject)
    const requiredCapability =
      operation === ActionGovernanceOperation.ACTION_AUTHORIZE
        ? 'action:authorize'
        : 'action:reject';

    const actorCaps = actor.capabilities || [];
    const hasWildcard = actorCaps.includes('*') || actorCaps.includes('action:*');
    const hasDirect = actorCaps.includes(requiredCapability);

    if (!hasWildcard && !hasDirect) {
      return {
        allowed: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        reason: `Ator não possui a permissão requerida: ${requiredCapability}.`,
      };
    }

    return { allowed: true, code: 'ALLOW' };
  }

  /**
   * Registra evento no audit trail em conformidade com IDecisionAuditTrail.
   */
  private async recordAudit(
    actor: ActorContext,
    proposal: ActionProposalRecord,
    operation: ActionGovernanceOperation,
    result: 'ALLOWED' | 'DENIED' | 'SUCCESS' | 'FAILED',
    reason?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!this.auditTrail) {
      return;
    }

    const auditTenantId = actor?.tenantId || this.tenantId;

    await this.auditTrail.record({
      tenantId: auditTenantId,
      actorId: actor?.actorId || 'unknown',
      actorType: actor?.actorType || 'UNKNOWN',
      decisionId: proposal?.decisionId || 'unknown',
      operation,
      result,
      reason,
      source: 'ActionGovernanceService',
      decisionCategory: proposal?.category,
      decisionPriority: proposal?.priority,
      details: {
        proposalId: proposal?.id,
        actionTitle: proposal?.title,
        previousStatus: proposal?.status,
        ...(details || {}),
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * AUTORIZA uma proposta de ação:
   * Transição permitida: PROPOSED -> AUTHORIZED
   * Bloqueia qualquer outro estado anterior (ex: REJECTED, CANCELLED ou já AUTHORIZED).
   */
  async authorize(params: AuthorizeActionParams): Promise<ActionProposalRecord> {
    const { proposalId, actor, notes } = params;

    // 1. Busca proposta no repositório do tenant
    const proposal = await this.repository.find(proposalId);
    if (!proposal) {
      throw new Error(`ActionGovernanceService: Proposta '${proposalId}' não encontrada no tenant '${this.tenantId}'.`);
    }

    // 2. Validação de ator humano
    try {
      this.validateHumanActor(actor);
    } catch (actorErr: any) {
      await this.recordAudit(actor, proposal, ActionGovernanceOperation.ACTION_AUTHORIZE, 'DENIED', actorErr.message);
      throw actorErr;
    }

    // 3. Validação de segurança e permissões
    const evalResult = this.evaluatePolicy(actor, ActionGovernanceOperation.ACTION_AUTHORIZE, proposal);
    if (!evalResult.allowed) {
      await this.recordAudit(
        actor,
        proposal,
        ActionGovernanceOperation.ACTION_AUTHORIZE,
        'DENIED',
        evalResult.reason || 'Operação negada pelo PolicyGuard.'
      );
      throw new Error(`ActionGovernanceService: Operação negada. ${evalResult.reason}`);
    }

    // 4. Máquina de Estados: apenas PROPOSED -> AUTHORIZED
    if (proposal.status !== ActionProposalStatus.PROPOSED) {
      const stateErr = `Transição de estado inválida: Proposta '${proposalId}' está com status '${proposal.status}' e não pode ser autorizada (esperado: PROPOSED).`;
      await this.recordAudit(actor, proposal, ActionGovernanceOperation.ACTION_AUTHORIZE, 'FAILED', stateErr);
      throw new Error(`ActionGovernanceService: ${stateErr}`);
    }

    // 5. Metadados de autorização (autor, timestamp, notas)
    const now = new Date().toISOString();
    const authorizationMetadata = {
      authorizedBy: {
        actorId: actor.actorId,
        actorType: actor.actorType,
        tenantId: actor.tenantId,
      },
      authorizedAt: now,
      notes: notes || null,
    };

    // 6 e 7. Atualização persistente e Auditoria ATÔMICAS sob a mesma transação
    const auditEvent = {
      tenantId: actor.tenantId || this.tenantId,
      actorId: actor.actorId,
      actorType: actor.actorType,
      decisionId: proposal.decisionId,
      operation: ActionGovernanceOperation.ACTION_AUTHORIZE,
      result: 'SUCCESS' as const,
      reason: 'Proposta de ação autorizada com sucesso por operador humano.',
      source: 'ActionGovernanceService',
      decisionCategory: proposal.category,
      decisionPriority: proposal.priority,
      details: {
        proposalId: proposal.id,
        actionTitle: proposal.title,
        previousStatus: proposal.status,
        authorization: authorizationMetadata,
      },
      timestamp: now,
    };

    const isPrismaRepo = typeof (this.repository as any).getPrismaClient === 'function';
    const hasTxAudit = this.auditTrail && typeof (this.auditTrail as any).recordInTransaction === 'function';

    if (isPrismaRepo && hasTxAudit) {
      const prismaClient = (this.repository as any).getPrismaClient();
      await prismaClient.$transaction(async (tx: any) => {
        const updated = await this.repository.updateStatus(
          proposal.id,
          ActionProposalStatus.AUTHORIZED,
          { authorization: authorizationMetadata },
          ActionProposalStatus.PROPOSED,
          tx
        );

        if (!updated) {
          const stateErr = `Transição de estado inválida ou concorrente: Proposta '${proposalId}' não pôde ser atualizada (esperado: PROPOSED).`;
          throw new Error(`ActionGovernanceService: ${stateErr}`);
        }

        await (this.auditTrail as any).recordInTransaction(tx, auditEvent);
      });
    } else {
      // Bloqueia fallback não transacional se a persistência for relacional/Prisma
      if (isPrismaRepo && this.auditTrail) {
        throw new Error(
          'ActionGovernanceService: Configuração inválida. Repositório relacional exige ITransactionalAuditTrail para garantir atomicidade.'
        );
      }

      const updated = await this.repository.updateStatus(
        proposal.id,
        ActionProposalStatus.AUTHORIZED,
        { authorization: authorizationMetadata },
        ActionProposalStatus.PROPOSED
      );

      if (!updated) {
        const stateErr = `Transição de estado inválida ou concorrente: Proposta '${proposalId}' não pôde ser atualizada (esperado: PROPOSED).`;
        await this.recordAudit(actor, proposal, ActionGovernanceOperation.ACTION_AUTHORIZE, 'FAILED', stateErr);
        throw new Error(`ActionGovernanceService: ${stateErr}`);
      }

      await this.recordAudit(
        actor,
        proposal,
        ActionGovernanceOperation.ACTION_AUTHORIZE,
        'SUCCESS',
        'Proposta de ação autorizada com sucesso por operador humano.',
        { authorization: authorizationMetadata }
      );
    }

    const refreshed = await this.repository.find(proposalId);
    return refreshed!;
  }

  /**
   * REJEITA uma proposta de ação:
   * Transição permitida: PROPOSED -> REJECTED
   * Bloqueia qualquer outro estado anterior e exige motivo obrigatório (reason).
   */
  async reject(params: RejectActionParams): Promise<ActionProposalRecord> {
    const { proposalId, actor, reason } = params;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      throw new Error('ActionGovernanceService: Motivo da rejeição (reason) é obrigatório e não pode ser vazio.');
    }

    // 1. Busca proposta no repositório do tenant
    const proposal = await this.repository.find(proposalId);
    if (!proposal) {
      throw new Error(`ActionGovernanceService: Proposta '${proposalId}' não encontrada no tenant '${this.tenantId}'.`);
    }

    // 2. Validação de ator humano
    try {
      this.validateHumanActor(actor);
    } catch (actorErr: any) {
      await this.recordAudit(actor, proposal, ActionGovernanceOperation.ACTION_REJECT, 'DENIED', actorErr.message);
      throw actorErr;
    }

    // 3. Validação de segurança e permissões
    const evalResult = this.evaluatePolicy(actor, ActionGovernanceOperation.ACTION_REJECT, proposal);
    if (!evalResult.allowed) {
      await this.recordAudit(
        actor,
        proposal,
        ActionGovernanceOperation.ACTION_REJECT,
        'DENIED',
        evalResult.reason || 'Operação negada pelo PolicyGuard.'
      );
      throw new Error(`ActionGovernanceService: Operação negada. ${evalResult.reason}`);
    }

    // 4. Máquina de Estados: apenas PROPOSED -> REJECTED
    if (proposal.status !== ActionProposalStatus.PROPOSED) {
      const stateErr = `Transição de estado inválida: Proposta '${proposalId}' está com status '${proposal.status}' e não pode ser rejeitada (esperado: PROPOSED).`;
      await this.recordAudit(actor, proposal, ActionGovernanceOperation.ACTION_REJECT, 'FAILED', stateErr);
      throw new Error(`ActionGovernanceService: ${stateErr}`);
    }

    // 5. Metadados de rejeição (autor, timestamp, motivo obrigatório)
    const now = new Date().toISOString();
    const rejectionMetadata = {
      rejectedBy: {
        actorId: actor.actorId,
        actorType: actor.actorType,
        tenantId: actor.tenantId,
      },
      rejectedAt: now,
      rejectionReason: reason.trim(),
    };

    // 6 e 7. Atualização persistente e Auditoria ATÔMICAS sob a mesma transação
    const auditEvent = {
      tenantId: actor.tenantId || this.tenantId,
      actorId: actor.actorId,
      actorType: actor.actorType,
      decisionId: proposal.decisionId,
      operation: ActionGovernanceOperation.ACTION_REJECT,
      result: 'SUCCESS' as const,
      reason: `Proposta de ação rejeitada por operador humano. Motivo: ${reason.trim()}`,
      source: 'ActionGovernanceService',
      decisionCategory: proposal.category,
      decisionPriority: proposal.priority,
      details: {
        proposalId: proposal.id,
        actionTitle: proposal.title,
        previousStatus: proposal.status,
        rejection: rejectionMetadata,
      },
      timestamp: now,
    };

    const isPrismaRepo = typeof (this.repository as any).getPrismaClient === 'function';
    const hasTxAudit = this.auditTrail && typeof (this.auditTrail as any).recordInTransaction === 'function';

    if (isPrismaRepo && hasTxAudit) {
      const prismaClient = (this.repository as any).getPrismaClient();
      await prismaClient.$transaction(async (tx: any) => {
        const updated = await this.repository.updateStatus(
          proposal.id,
          ActionProposalStatus.REJECTED,
          { rejection: rejectionMetadata },
          ActionProposalStatus.PROPOSED,
          tx
        );

        if (!updated) {
          const stateErr = `Transição de estado inválida ou concorrente: Proposta '${proposalId}' não pôde ser atualizada (esperado: PROPOSED).`;
          throw new Error(`ActionGovernanceService: ${stateErr}`);
        }

        await (this.auditTrail as any).recordInTransaction(tx, auditEvent);
      });
    } else {
      // Bloqueia fallback não transacional se a persistência for relacional/Prisma
      if (isPrismaRepo && this.auditTrail) {
        throw new Error(
          'ActionGovernanceService: Configuração inválida. Repositório relacional exige ITransactionalAuditTrail para garantir atomicidade.'
        );
      }

      const updated = await this.repository.updateStatus(
        proposal.id,
        ActionProposalStatus.REJECTED,
        { rejection: rejectionMetadata },
        ActionProposalStatus.PROPOSED
      );

      if (!updated) {
        const stateErr = `Transição de estado inválida ou concorrente: Proposta '${proposalId}' não pôde ser atualizada (esperado: PROPOSED).`;
        await this.recordAudit(actor, proposal, ActionGovernanceOperation.ACTION_REJECT, 'FAILED', stateErr);
        throw new Error(`ActionGovernanceService: ${stateErr}`);
      }

      await this.recordAudit(
        actor,
        proposal,
        ActionGovernanceOperation.ACTION_REJECT,
        'SUCCESS',
        `Proposta de ação rejeitada por operador humano. Motivo: ${reason.trim()}`,
        { rejection: rejectionMetadata }
      );
    }

    const refreshed = await this.repository.find(proposalId);
    return refreshed!;
  }
}
