import { PipelineStep } from '../../domain/PipelineStep';
import { PipelineContext } from '../../domain/PipelineContext';
import { NormalizerService } from '../../application/NormalizerService';
import { Normalizer } from '../../domain/Normalizer';

export class NormalizerStep implements PipelineStep {
  constructor(private customNormalizer?: Normalizer) {}

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!context.ingestionRecord) {
      throw new Error('NormalizerStep requer "ingestionRecord" previamente populado no contexto.');
    }

    const normalizer = this.customNormalizer || NormalizerService;
    const normalizedRecord = await normalizer.normalize(context.ingestionRecord);

    return {
      ...context,
      normalizedRecord,
    };
  }
}

