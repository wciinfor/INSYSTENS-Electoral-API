import { ActorContext } from './ActorContext';

export enum DecisionOperation {
  DECISION_VIEW = 'DECISION_VIEW',
  DECISION_REGISTER = 'DECISION_REGISTER',
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  reason?: string;
  code?: 'ALLOW' | 'TENANT_MISMATCH' | 'INSUFFICIENT_PERMISSIONS' | 'INVALID_ACTOR';
}

export interface ProtectedResourceContext {
  tenantId: string;
  decisionId?: string;
  category?: string;
  priority?: string;
}

export class PolicyGuard {
  /**
   * Avalia soberanamente se o ator pode executar a operação solicitada sobre o recurso.
   * Regra número 1 inquebrável: Isolamento multi-tenant (actor.tenantId === resource.tenantId).
   */
  static evaluate(
    actor: ActorContext,
    operation: DecisionOperation | string,
    resource: ProtectedResourceContext
  ): PolicyEvaluationResult {
    // 1. Validação de integridade do ator
    if (!actor || !actor.tenantId || typeof actor.tenantId !== 'string' || actor.tenantId.trim() === '') {
      return {
        allowed: false,
        code: 'INVALID_ACTOR',
        reason: 'Ator inválido ou sem tenantId informado.',
      };
    }

    if (!actor.actorId || typeof actor.actorId !== 'string' || actor.actorId.trim() === '') {
      return {
        allowed: false,
        code: 'INVALID_ACTOR',
        reason: 'Ator inválido ou sem actorId informado.',
      };
    }

    // 2. Validação estrita de isolamento multi-tenant
    if (!resource || !resource.tenantId || typeof resource.tenantId !== 'string') {
      return {
        allowed: false,
        code: 'TENANT_MISMATCH',
        reason: 'Recurso protegido não possui tenantId definido.',
      };
    }

    if (actor.tenantId !== resource.tenantId) {
      return {
        allowed: false,
        code: 'TENANT_MISMATCH',
        reason: `Violação de isolamento multi-tenant: Ator do tenant '${actor.tenantId}' tentou acessar recurso do tenant '${resource.tenantId}'.`,
      };
    }

    // 3. Validação de capabilities específicas se fornecidas
    if (actor.capabilities && actor.capabilities.length > 0) {
      const requiredCapability = `decision:${operation.toLowerCase()}`;
      const hasWildcard = actor.capabilities.includes('*') || actor.capabilities.includes('decision:*');
      const hasDirect = actor.capabilities.includes(requiredCapability);

      if (!hasWildcard && !hasDirect) {
        return {
          allowed: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          reason: `Ator não possui a permissão requerida: ${requiredCapability}.`,
        };
      }
    }

    // 4. Se passou por todas as barreiras, operação é concedida
    return {
      allowed: true,
      code: 'ALLOW',
      reason: 'Operação autorizada com sucesso pelo PolicyGuard.',
    };
  }

  /**
   * Atalho booleano para checagem rápida.
   */
  static isAllowed(
    actor: ActorContext,
    operation: DecisionOperation | string,
    resource: ProtectedResourceContext
  ): boolean {
    return this.evaluate(actor, operation, resource).allowed;
  }
}
