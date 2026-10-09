import { ImportSession } from '../domain/ImportSession';
import { ImportSessionStatus } from '../domain/ImportSessionStatus';
import { ImportSessionRegistry } from './ImportSessionRegistry';

export class ImportSessionService {
  /**
   * Cria uma nova sessão com status 'created'
   */
  static create(provider: string, metadata?: Record<string, any>): ImportSession {
    const id = `sess-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const session: ImportSession = {
      id,
      provider,
      status: 'created',
      metrics: {
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
      },
      duration: 0,
      metadata: metadata || {},
    };

    ImportSessionRegistry.add(session);
    
    this.logObservability(session);
    return session;
  }

  /**
   * Inicia a execução da sessão, marcando status como 'running' e definindo startedAt
   */
  static start(sessionId: string): ImportSession {
    const session = this.findSession(sessionId);

    if (session.status !== 'created') {
      throw new Error(`Não é possível iniciar uma sessão no status: "${session.status}". Apenas sessões "created" podem ser iniciadas.`);
    }

    session.status = 'running';
    session.startedAt = new Date().toISOString();

    ImportSessionRegistry.update(session);
    this.logObservability(session);
    return session;
  }

  /**
   * Atualiza as métricas de progresso de uma sessão em execução
   */
  static progress(
    sessionId: string,
    successInc: number,
    failedInc: number,
    skippedInc: number
  ): ImportSession {
    const session = this.findSession(sessionId);

    if (session.status !== 'running') {
      throw new Error(`Não é possível atualizar o progresso de uma sessão finalizada ou não iniciada (status atual: "${session.status}").`);
    }

    session.metrics.success += successInc;
    session.metrics.failed += failedInc;
    session.metrics.skipped += skippedInc;
    session.metrics.processed =
      session.metrics.success + session.metrics.failed + session.metrics.skipped;

    ImportSessionRegistry.update(session);
    this.logObservability(session);
    return session;
  }

  /**
   * Conclui a sessão com sucesso, marcando-a como 'completed' e calculando a duração
   */
  static complete(sessionId: string): ImportSession {
    const session = this.findSession(sessionId);

    if (session.status !== 'running') {
      throw new Error(`Não é possível concluir uma sessão que não está em execução (status atual: "${session.status}").`);
    }

    const finishedAt = new Date().toISOString();
    session.status = 'completed';
    session.finishedAt = finishedAt;
    
    if (session.startedAt) {
      session.duration = Date.parse(finishedAt) - Date.parse(session.startedAt);
    }

    ImportSessionRegistry.update(session);
    this.logObservability(session);
    return session;
  }

  /**
   * Finaliza a sessão com falha, gravando o erro em metadata e calculando a duração
   */
  static fail(sessionId: string, errorMsg?: string): ImportSession {
    const session = this.findSession(sessionId);

    if (session.status === 'completed' || session.status === 'cancelled' || session.status === 'failed') {
      throw new Error(`Não é possível falhar uma sessão já finalizada no status: "${session.status}".`);
    }

    const finishedAt = new Date().toISOString();
    session.status = 'failed';
    session.finishedAt = finishedAt;
    
    if (!session.metadata) {
      session.metadata = {};
    }
    session.metadata.error = errorMsg || 'Erro desconhecido na execução da sessão.';

    if (session.startedAt) {
      session.duration = Date.parse(finishedAt) - Date.parse(session.startedAt);
    }

    ImportSessionRegistry.update(session);
    this.logObservability(session);
    return session;
  }

  /**
   * Cancela a execução de uma sessão ativa
   */
  static cancel(sessionId: string): ImportSession {
    const session = this.findSession(sessionId);

    if (session.status === 'completed' || session.status === 'cancelled' || session.status === 'failed') {
      throw new Error(`Não é possível cancelar uma sessão já finalizada no status: "${session.status}".`);
    }

    const finishedAt = new Date().toISOString();
    session.status = 'cancelled';
    session.finishedAt = finishedAt;

    if (session.startedAt) {
      session.duration = Date.parse(finishedAt) - Date.parse(session.startedAt);
    }

    ImportSessionRegistry.update(session);
    this.logObservability(session);
    return session;
  }

  /**
   * Método auxiliar para buscar e garantir a existência de uma sessão
   */
  private static findSession(sessionId: string): ImportSession {
    const session = ImportSessionRegistry.get(sessionId);
    if (!session) {
      throw new Error(`Sessão de importação com ID "${sessionId}" não encontrada.`);
    }
    return session;
  }

  /**
   * Log estruturado de observabilidade
   */
  private static logObservability(session: ImportSession): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'data_platform_session_status_change',
        level: session.status === 'failed' ? 'ERROR' : 'INFO',
        sessionId: session.id,
        provider: session.provider,
        status: session.status,
        processed: session.metrics.processed,
        success: session.metrics.success,
        failed: session.metrics.failed,
        elapsedTime: session.duration,
        error: session.metadata?.error,
      })
    );
  }
}
