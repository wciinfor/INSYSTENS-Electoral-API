import { PipelineContext } from './PipelineContext';

export interface PipelineStep {
  execute(context: PipelineContext): Promise<PipelineContext>;
}
