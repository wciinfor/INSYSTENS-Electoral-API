import { PipelineContext } from '../domain/PipelineContext';
import { PipelineStep } from '../domain/PipelineStep';
import { ImportSessionService } from './ImportSessionService';

export class Pipeline {
  constructor(private steps: PipelineStep[]) {}

  /**
   * Executa o pipeline de forma sequencial com imutabilidade de contextos
   */
  async run(initialContext: PipelineContext): Promise<PipelineContext> {
    let context = { ...initialContext };

    for (const step of this.steps) {
      const stepName = step.constructor.name;
      const start = Date.now();

      try {
        context = await step.execute(context);
        const duration = Date.now() - start;

        this.logStep({
          sessionId: context.session.id,
          step: stepName,
          elapsedTime: duration,
          status: 'success',
          entity: context.mappedRecord?.entity || 'generic',
          validationScore: context.validationResult?.score,
        });
      } catch (err: any) {
        const duration = Date.now() - start;
        this.logStep({
          sessionId: context.session.id,
          step: stepName,
          elapsedTime: duration,
          status: 'failed',
          entity: 'generic',
          error: err.message,
        });

        // Incrementa falha e sinaliza falha geral na sessão
        ImportSessionService.progress(context.session.id, 0, 1, 0);
        ImportSessionService.fail(context.session.id, `Falha no passo ${stepName}: ${err.message}`);
        
        throw err;
      }
    }

    // Atualiza ImportSession baseado no status final do registro
    if (context.validationResult && !context.validationResult.valid) {
      ImportSessionService.progress(context.session.id, 0, 0, 1);
    } else if (context.mappedRecord) {
      ImportSessionService.progress(context.session.id, 1, 0, 0);
    }

    return context;
  }

  /**
   * Log estruturado de observabilidade do step
   */
  private logStep(log: {
    sessionId: string;
    step: string;
    elapsedTime: number;
    status: 'success' | 'failed';
    entity: string;
    validationScore?: number;
    error?: string;
  }): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'data_platform_pipeline_step_execute',
        level: log.status === 'failed' ? 'ERROR' : 'INFO',
        ...log,
      })
    );
  }
}
