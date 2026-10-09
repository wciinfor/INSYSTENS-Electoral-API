import { PrismaClient } from '@prisma/client';
import { PrismaActionProposalRepository } from '../../intelligence/infrastructure/PrismaActionProposalRepository';
import { PrismaActionExecutionRepository } from '../../intelligence/infrastructure/PrismaActionExecutionRepository';
import { PrismaDecisionAuditTrail } from '../../intelligence/audit/PrismaDecisionAuditTrail';
import { ActionGovernanceService } from '../../intelligence/application/ActionGovernanceService';
import { ActionExecutionService } from '../../intelligence/application/ActionExecutionService';
import { ActionProposalFactory } from '../../intelligence/application/ActionProposalFactory';
import { ActionProposalStatus } from '../../intelligence/domain/ActionProposalRecord';
import { ActionExecutionMode, ActionExecutionStatus } from '../../intelligence/domain/ActionExecutionRecord';
import { ActorContext } from '../../intelligence/security/ActorContext';

const DB_URL = 'postgresql://insystens_test:TestOnly_8xQ!2026@127.0.0.1:54339/insystens_test?schema=public';

async function runRealPgIntegrationTests() {
  console.log('=== INICIANDO BATERIA DE TESTES REAIS NO POSTGRESQL DESCARTÁVEL (16.15) ===\n');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DB_URL,
      },
    },
  });

  // 0. Confirmação do Destino
  const ident: any = await prisma.$queryRawUnsafe(
    'SELECT current_database() as db, current_user as usr, inet_server_port() as port, version() as ver;'
  );
  console.log('0. Destino confirmado:', ident[0]);
  if (ident[0].db !== 'insystens_test' || ident[0].usr !== 'insystens_test') {
    throw new Error('ABORT: Conexão não corresponde ao banco descartável esperado.');
  }

  // Limpeza prévia de registros de testes anteriores para garantir idempotência estrita
  await prisma.actionExecutionRecord.deleteMany({ where: { tenantId: { in: ['tenant_real_pg_alpha', 'tenant_real_pg_beta'] } } });
  await prisma.actionProposalRecord.deleteMany({ where: { tenantId: { in: ['tenant_real_pg_alpha', 'tenant_real_pg_beta'] } } });
  await prisma.decisionAuditEventRecord.deleteMany({ where: { tenantId: { in: ['tenant_real_pg_alpha', 'tenant_real_pg_beta'] } } });
  console.log('Dados de testes anteriores dos tenants limpos com sucesso.');

  const tenantAlpha = 'tenant_real_pg_alpha';
  const tenantBeta = 'tenant_real_pg_beta';

  const proposalRepoAlpha = new PrismaActionProposalRepository({ tenantId: tenantAlpha, prisma });
  const executionRepoAlpha = new PrismaActionExecutionRepository({ tenantId: tenantAlpha, prisma });
  const auditAlpha = new PrismaDecisionAuditTrail({ prisma });

  const proposalRepoBeta = new PrismaActionProposalRepository({ tenantId: tenantBeta, prisma });
  const executionRepoBeta = new PrismaActionExecutionRepository({ tenantId: tenantBeta, prisma });
  const auditBeta = new PrismaDecisionAuditTrail({ prisma });

  const govAlpha = new ActionGovernanceService({
    repository: proposalRepoAlpha,
    tenantId: tenantAlpha,
    auditTrail: auditAlpha,
  });

  const execAlpha = new ActionExecutionService({
    proposalRepository: proposalRepoAlpha,
    executionRepository: executionRepoAlpha,
    tenantId: tenantAlpha,
    auditTrail: auditAlpha,
  });

  const actorHuman1: ActorContext = {
    tenantId: tenantAlpha,
    actorId: 'usr-human-1',
    actorType: 'PARLAMENTAR',
    capabilities: ['action:authorize', 'action:reject'],
  };

  const actorHuman2: ActorContext = {
    tenantId: tenantAlpha,
    actorId: 'usr-human-2',
    actorType: 'PARLAMENTAR',
    capabilities: ['action:authorize', 'action:reject'],
  };

  const actorBeta: ActorContext = {
    tenantId: tenantBeta,
    actorId: 'usr-human-beta',
    actorType: 'PARLAMENTAR',
    capabilities: ['*'],
  };

  const results: Record<string, any> = {};

  try {
    // ----------------------------------------------------------------------------------------
    // TESTE 1: Autorizações Concorrentes da Mesma Proposta no PostgreSQL Real
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 1: Autorizações Concorrentes da Mesma Proposta ---');
    const mockDecision1: any = {
      tenantId: tenantAlpha,
      id: 'dec-real-pg-001',
      category: 'territorial_expansion',
      priority: 'high',
      confidence: 1.0,
      recommendedActions: [
        {
          title: 'Ação para Teste de Corrida na Autorização',
          priority: 'HIGH',
          expectedImpact: 'Alto',
          estimatedGain: 1500,
          timeframe: '7 dias',
        },
      ],
    };
    const prop1 = ActionProposalFactory.fromDecision(mockDecision1)[0];
    await proposalRepoAlpha.store(prop1);

    // Dispara 2 autorizações simultâneas
    const authPromises = [
      govAlpha.authorize({ proposalId: prop1.id, actor: actorHuman1, notes: 'Aprovado por Operador 1' })
        .then(() => ({ success: true, actor: 'actor1', error: null }))
        .catch((err: any) => ({ success: false, actor: 'actor1', error: err.message })),
      govAlpha.authorize({ proposalId: prop1.id, actor: actorHuman2, notes: 'Aprovado por Operador 2' })
        .then(() => ({ success: true, actor: 'actor2', error: null }))
        .catch((err: any) => ({ success: false, actor: 'actor2', error: err.message })),
    ];
    const authResults = await Promise.all(authPromises);

    const successfulAuths = authResults.filter((r: any) => r.success);
    const rejectedAuths = authResults.filter((r: any) => !r.success);

    const prop1Db = await proposalRepoAlpha.find(prop1.id);
    const auditsProp1 = await auditAlpha.listByTenant(tenantAlpha);
    const authAudits = auditsProp1.filter((a: any) => a.details?.proposalId === prop1.id);

    console.log(`Sucessos: ${successfulAuths.length}, Rejeições: ${rejectedAuths.length}`);
    console.log(`Status no PostgreSQL: ${prop1Db?.status}`);
    console.log(`Auditorias geradas: ${authAudits.length} (Resultados: ${authAudits.map((a: any) => a.result).join(', ')})`);

    results.test1 = {
      totalDispatched: 2,
      successfulCount: successfulAuths.length,
      rejectedCount: rejectedAuths.length,
      rejectionReason: rejectedAuths[0]?.error,
      finalStatus: prop1Db?.status,
      auditRecords: authAudits.length,
      passed: successfulAuths.length === 1 && rejectedAuths.length === 1 && prop1Db?.status === 'AUTHORIZED',
    };

    // ----------------------------------------------------------------------------------------
    // TESTE 2: Tentativas de Execução Concorrentes para a Mesma Proposta (Unique Constraint)
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Criação Concorrente de Tentativas de Execução ---');
    // prop1 agora está AUTHORIZED. Disparamos 2 chamadas de dispatch concorrentes
    const dispatchPromises = [
      execAlpha.dispatch({ proposalId: prop1.id, actor: actorHuman1, mode: ActionExecutionMode.SIMULATED })
        .then((rec: any) => ({ success: true, rec, error: null, code: null }))
        .catch((err: any) => ({ success: false, rec: null, error: err.message, code: err.code })),
      execAlpha.dispatch({ proposalId: prop1.id, actor: actorHuman2, mode: ActionExecutionMode.SIMULATED })
        .then((rec: any) => ({ success: true, rec, error: null, code: null }))
        .catch((err: any) => ({ success: false, rec: null, error: err.message, code: err.code })),
    ];
    const dispatchResults = await Promise.all(dispatchPromises);

    const successfulDispatches = dispatchResults.filter((r: any) => r.success);
    const failedDispatches = dispatchResults.filter((r: any) => !r.success);

    const executionsDb = await executionRepoAlpha.listByProposal(prop1.id);

    console.log(`Dispatches com sucesso: ${successfulDispatches.length}, Falhas: ${failedDispatches.length}`);
    if (failedDispatches.length > 0) {
      console.log(`Erro do dispatch perdedor: ${failedDispatches[0].error}`);
    }
    console.log(`Execuções persistidas na tabela: ${executionsDb.length}`);

    results.test2 = {
      successfulCount: successfulDispatches.length,
      failedCount: failedDispatches.length,
      failedError: failedDispatches[0]?.error,
      dbRows: executionsDb.length,
      hasUniqueViolation: failedDispatches.some((f: any) => f.error?.includes('Unique constraint') || f.error?.includes('ActionExecutionRecord_tenantId_proposalId_attemptNumber_key') || f.code === 'P2002'),
    };

    // ----------------------------------------------------------------------------------------
    // TESTE 3: Preservação de Estados Avançados durante Reprocessamento / Concorrência
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Preservação de Estados durante Reprocessamento ---');
    const reingestedProp = { ...prop1, status: ActionProposalStatus.PROPOSED, description: 'Descrição atualizada pelo pipeline' };
    let test3Error: any = null;
    try {
      await proposalRepoAlpha.storeMany([reingestedProp]);
    } catch (err: any) {
      test3Error = err;
      console.log(`FALHA NO TESTE 3: ${err.message || err}`);
    }

    const prop1AfterReingest = await proposalRepoAlpha.find(prop1.id);
    console.log(`Status após storeMany re-ingestão: ${prop1AfterReingest?.status} (Esperado: AUTHORIZED)`);
    console.log(`Descrição após storeMany: ${prop1AfterReingest?.description}`);

    results.test3 = {
      initialStatus: 'AUTHORIZED',
      statusAfterReingest: prop1AfterReingest?.status,
      preserved: prop1AfterReingest?.status === 'AUTHORIZED',
      dataUpdated: prop1AfterReingest?.description === 'Descrição atualizada pelo pipeline',
      error: test3Error ? { name: test3Error.name, code: test3Error.code, message: test3Error.message } : null,
      passed: !test3Error && prop1AfterReingest?.status === 'AUTHORIZED',
    };

    // ----------------------------------------------------------------------------------------
    // TESTE 4: Isolamento Estrito entre Tenants (PostgreSQL Real)
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Isolamento Estrito entre Tenants ---');
    // Tenant Beta tenta ler proposta de Alpha
    const betaFindAlpha = await proposalRepoBeta.find(prop1.id);
    const betaCountProposals = await proposalRepoBeta.count();
    const betaCountExecutions = await executionRepoBeta.count();

    // Tenant Beta tenta autorizar proposta de Alpha via governança
    let crossTenantAuthBlocked = false;
    let crossTenantError = '';
    try {
      await govAlpha.authorize({ proposalId: prop1.id, actor: actorBeta });
    } catch (err: any) {
      crossTenantAuthBlocked = true;
      crossTenantError = err.message;
    }

    // Tenant Beta tenta atualizar diretamente no banco com tenantId adulterado
    const directTamperResult = await proposalRepoBeta.updateStatus(prop1.id, ActionProposalStatus.REJECTED);

    console.log(`Beta leitura direta de Alpha: ${betaFindAlpha === null ? 'BLOQUEADO (null)' : 'VAZOU'}`);
    console.log(`Beta contagem de propostas: ${betaCountProposals}, execuções: ${betaCountExecutions}`);
    console.log(`Tentativa cross-tenant bloqueada na governança: ${crossTenantAuthBlocked} (${crossTenantError})`);
    console.log(`Tentativa de adulteração direta por Beta updateStatus: ${directTamperResult} (Esperado: false)`);

    results.test4 = {
      crossReadIsolated: betaFindAlpha === null,
      betaProposals: betaCountProposals,
      betaExecutions: betaCountExecutions,
      crossTenantAuthBlocked,
      directTamperBlocked: directTamperResult === false,
      passed: betaFindAlpha === null && betaCountProposals === 0 && crossTenantAuthBlocked && directTamperResult === false,
    };

    // ----------------------------------------------------------------------------------------
    // TESTE 5: Falha na Gravação da Auditoria após Mudança de Estado
    // ----------------------------------------------------------------------------------------
    // TESTE 5: Atomicidade e Rollback Físico diante de Falha na Gravação de Auditoria (Fase 4B)
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 5: Auditoria Atômica e Rollback Transacional no PostgreSQL Real ---');
    
    // 5.0 Bloqueio de Fallback Inseguro: repositório relacional com auditTrail não transacional
    const nonTxAuditTrail = {
      record: async () => {},
      recordMany: async () => {},
      listByTenant: async () => [],
      listByDecision: async () => [],
      count: async () => 0,
      clear: async () => {},
    };
    const govNonTxAudit = new ActionGovernanceService({
      repository: proposalRepoAlpha,
      tenantId: tenantAlpha,
      auditTrail: nonTxAuditTrail as any,
    });
    let configBlocked = false;
    let configError = '';
    const propConfigTest = ActionProposalFactory.fromDecision({
      tenantId: tenantAlpha,
      id: 'dec-config-check',
      category: 'territorial_expansion',
      priority: 'high',
      confidence: 1.0,
      recommendedActions: [{ title: 'Config Test', description: 'Test description', priority: 'HIGH' as any, expectedImpact: 'High', estimatedGain: 10, timeframe: '1d' }],
    } as any)[0];
    await proposalRepoAlpha.store(propConfigTest);
    try {
      await govNonTxAudit.authorize({ proposalId: propConfigTest.id, actor: actorHuman1 });
    } catch (err: any) {
      configBlocked = true;
      configError = err.message;
    }

    // 5.1 Teste de Rollback Atômico em AUTHORIZE
    const mockDecisionAuditFail: any = {
      tenantId: tenantAlpha,
      id: 'dec-real-audit-fail-001',
      category: 'risk_mitigation',
      priority: 'high',
      confidence: 1.0,
      recommendedActions: [
        {
          title: 'Ação para Teste de Falha de Auditoria',
          priority: 'HIGH',
          expectedImpact: 'Alto',
          estimatedGain: 500,
          timeframe: '5 dias',
        },
      ],
    };
    const propAuditFail = ActionProposalFactory.fromDecision(mockDecisionAuditFail)[0];
    await proposalRepoAlpha.store(propAuditFail);

    // Audit Trail transacional que falha intencionalmente dentro da transação
    const failingTxAuditTrail = {
      record: async () => {},
      recordMany: async () => {},
      recordInTransaction: async () => {
        throw new Error('SIMULATED_TX_AUDIT_FAILURE: Falha forçada na gravação de auditoria dentro da transação');
      },
      listByTenant: async () => [],
      listByDecision: async () => [],
      count: async () => 0,
      clear: async () => {},
    };

    const govWithFailingTxAudit = new ActionGovernanceService({
      repository: proposalRepoAlpha,
      tenantId: tenantAlpha,
      auditTrail: failingTxAuditTrail as any,
    });

    let authErrorCaught = false;
    let authErrorMessage = '';
    try {
      await govWithFailingTxAudit.authorize({ proposalId: propAuditFail.id, actor: actorHuman1 });
    } catch (err: any) {
      authErrorCaught = true;
      authErrorMessage = err.message;
    }

    // Verifica se houve rollback físico no banco PostgreSQL
    const propAuditFailDb = await proposalRepoAlpha.find(propAuditFail.id);
    console.log(`[5.1 Authorize] Erro propagado: ${authErrorCaught} (${authErrorMessage})`);
    console.log(`[5.1 Authorize] Estado no PostgreSQL após falha: ${propAuditFailDb?.status} (Esperado: PROPOSED - Rollback mantido)`);

    // 5.2 Teste de Rollback Atômico em REJECT
    let rejectErrorCaught = false;
    let rejectErrorMessage = '';
    try {
      await govWithFailingTxAudit.reject({ proposalId: propAuditFail.id, actor: actorHuman1, reason: 'Motivo teste' });
    } catch (err: any) {
      rejectErrorCaught = true;
      rejectErrorMessage = err.message;
    }
    const propAfterRejectFail = await proposalRepoAlpha.find(propAuditFail.id);
    console.log(`[5.2 Reject] Erro propagado: ${rejectErrorCaught} (${rejectErrorMessage})`);
    console.log(`[5.2 Reject] Estado no PostgreSQL após falha: ${propAfterRejectFail?.status} (Esperado: PROPOSED - Rollback mantido)`);

    // Agora autorizamos legitimamente usando auditAlpha para poder testar dispatch e complete
    await govAlpha.authorize({ proposalId: propAuditFail.id, actor: actorHuman1 });
    const propAuthorizedDb = await proposalRepoAlpha.find(propAuditFail.id);

    // 5.3 Teste de Rollback Atômico em DISPATCH
    const execWithFailingTxAudit = new ActionExecutionService({
      proposalRepository: proposalRepoAlpha,
      executionRepository: executionRepoAlpha,
      tenantId: tenantAlpha,
      auditTrail: failingTxAuditTrail as any,
    });

    let dispatchErrorCaught = false;
    let dispatchErrorMessage = '';
    try {
      await execWithFailingTxAudit.dispatch({ proposalId: propAuditFail.id, actor: actorHuman1, mode: ActionExecutionMode.SIMULATED });
    } catch (err: any) {
      dispatchErrorCaught = true;
      dispatchErrorMessage = err.message;
    }
    const executionsAfterDispatchFail = await executionRepoAlpha.listByProposal(propAuditFail.id);
    console.log(`[5.3 Dispatch] Erro propagado: ${dispatchErrorCaught} (${dispatchErrorMessage})`);
    console.log(`[5.3 Dispatch] Registros criados no PostgreSQL: ${executionsAfterDispatchFail.length} (Esperado: 0 - Rollback mantido)`);

    // Agora despachamos legitimamente usando execAlpha
    const validExecution = await execAlpha.dispatch({ proposalId: propAuditFail.id, actor: actorHuman1, mode: ActionExecutionMode.SIMULATED });

    // 5.4 Teste de Rollback Atômico em COMPLETE
    let completeErrorCaught = false;
    let completeErrorMessage = '';
    try {
      await execWithFailingTxAudit.complete({
        executionId: validExecution.id,
        actor: actorHuman1,
        success: true,
      });
    } catch (err: any) {
      completeErrorCaught = true;
      completeErrorMessage = err.message;
    }
    const execAfterCompleteFail = await executionRepoAlpha.findById(validExecution.id);
    console.log(`[5.4 Complete] Erro propagado: ${completeErrorCaught} (${completeErrorMessage})`);
    console.log(`[5.4 Complete] Estado da execução no PostgreSQL: ${execAfterCompleteFail?.status} (Esperado: DISPATCHED - Rollback mantido)`);

    results.test5 = {
      configFallbackBlocked: configBlocked,
      configErrorMessage: configError,
      authorizeRollback: {
        errorPropagated: authErrorCaught,
        dbStatus: propAuditFailDb?.status,
        passed: authErrorCaught && propAuditFailDb?.status === 'PROPOSED',
      },
      rejectRollback: {
        errorPropagated: rejectErrorCaught,
        dbStatus: propAfterRejectFail?.status,
        passed: rejectErrorCaught && propAfterRejectFail?.status === 'PROPOSED',
      },
      dispatchRollback: {
        errorPropagated: dispatchErrorCaught,
        dbRecordsCount: executionsAfterDispatchFail.length,
        passed: dispatchErrorCaught && executionsAfterDispatchFail.length === 0,
      },
      completeRollback: {
        errorPropagated: completeErrorCaught,
        dbStatus: execAfterCompleteFail?.status,
        passed: completeErrorCaught && execAfterCompleteFail?.status === 'DISPATCHED',
      },
      atomicRollbackPassed:
        configBlocked &&
        authErrorCaught && propAuditFailDb?.status === 'PROPOSED' &&
        rejectErrorCaught && propAfterRejectFail?.status === 'PROPOSED' &&
        dispatchErrorCaught && executionsAfterDispatchFail.length === 0 &&
        completeErrorCaught && execAfterCompleteFail?.status === 'DISPATCHED',
    };

    // ----------------------------------------------------------------------------------------
    // TESTE 6: Transações e Rollback em Lote (storeMany)
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 6: Rollback Transacional no PostgreSQL Real ---');
    const countBeforeTx = await proposalRepoAlpha.count();
    const validBatchProposal = ActionProposalFactory.createProposal(mockDecision1, {
      title: 'Proposta Transacional Válida',
      priority: 'HIGH' as any,
      expectedImpact: 'Alto',
      estimatedGain: 100,
      timeframe: '10 dias',
      description: 'Desc',
    });
    const malformedProposal: any = {
      tenantId: tenantAlpha,
      id: 'act-failing-trigger-db-null-error',
      title: null, // Força violação de NOT NULL no PostgreSQL
    };

    let txRollbackCaught = false;
    try {
      await proposalRepoAlpha.storeMany([validBatchProposal, malformedProposal]);
    } catch (err: any) {
      txRollbackCaught = true;
    }

    const countAfterTx = await proposalRepoAlpha.count();
    console.log(`Exceção capturada: ${txRollbackCaught}`);
    console.log(`Contagem antes da transação: ${countBeforeTx}, após rollback: ${countAfterTx}`);

    results.test6 = {
      txErrorCaught: txRollbackCaught,
      countBefore: countBeforeTx,
      countAfter: countAfterTx,
      rolledBack: countBeforeTx === countAfterTx,
    };

    // ----------------------------------------------------------------------------------------
    // TESTE 7: Consistência Ponta a Ponta: Histórico, Estado e Auditoria
    // ----------------------------------------------------------------------------------------
    console.log('\n--- TESTE 7: Consistência do Histórico de Execuções e Auditoria ---');
    // Para prop1, pegamos ou criamos uma execução em DISPATCHED e a concluímos
    let execToComplete = (await executionRepoAlpha.listByProposal(prop1.id)).find((e: any) => e.status === ActionExecutionStatus.DISPATCHED);
    if (!execToComplete) {
      execToComplete = await execAlpha.dispatch({ proposalId: prop1.id, actor: actorHuman1, mode: ActionExecutionMode.SIMULATED });
    }

    const completedExec = await execAlpha.complete({
      executionId: execToComplete.id,
      actor: actorHuman1,
      success: true,
      result: { status: 'SUCCESS_SIMULATED', votesReached: 1250 },
    });

    const history = await execAlpha.getHistory(prop1.id);
    const auditRows = await auditAlpha.listByTenant(tenantAlpha);

    console.log(`Execução concluída com status: ${completedExec.status}`);
    console.log(`Total de tentativas no histórico: ${history.length}`);
    console.log(`Total de eventos de auditoria registrados para Alpha: ${auditRows.length}`);

    results.test7 = {
      executionStatus: completedExec.status,
      historyCount: history.length,
      auditCount: auditRows.length,
      hasCompletionAudit: auditRows.some((a: any) => a.operation === 'ACTION_EXECUTION_SUCCESS'),
    };

    console.log('\n======================================================');
    console.log('RESUMO FINAL DOS TESTES NO POSTGRESQL REAL:');
    console.log(JSON.stringify(results, null, 2));
    console.log('======================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

runRealPgIntegrationTests().catch(err => {
  console.error('ERRO FATAL NA EXECUÇÃO:', err);
  process.exit(1);
});
