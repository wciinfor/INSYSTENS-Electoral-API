import { PipelineStep } from '../../domain/PipelineStep';
import { PipelineContext } from '../../domain/PipelineContext';
import { ValidatorService } from '../../application/ValidatorService';
import { Validator } from '../../domain/Validator';

export class ValidatorStep implements PipelineStep {
  constructor(private customValidator?: Validator) {}

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!context.normalizedRecord) {
      throw new Error('ValidatorStep requer "normalizedRecord" previamente populado no contexto.');
    }

    const validator = this.customValidator || ValidatorService;
    const validationResult = await validator.validate(context.normalizedRecord);

    return {
      ...context,
      validationResult,
    };
  }
}

