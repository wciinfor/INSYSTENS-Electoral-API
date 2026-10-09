import { Pipeline } from './Pipeline';
import { PipelineStep } from '../domain/PipelineStep';

export class PipelineBuilder {
  private steps: PipelineStep[] = [];

  /**
   * Adiciona um Step ao pipeline
   */
  add(step: PipelineStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Constrói e retorna a instância de Pipeline com os steps configurados
   */
  build(): Pipeline {
    return new Pipeline(this.steps);
  }
}
