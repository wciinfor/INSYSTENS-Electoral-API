import { PipelineStep } from '../../domain/PipelineStep';
import { PipelineContext } from '../../domain/PipelineContext';
import { MapperService } from '../../application/MapperService';
import { Mapper } from '../../domain/Mapper';

export class MapperStep implements PipelineStep {
  constructor(private customMapper?: Mapper) {}

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!context.validationResult) {
      throw new Error('MapperStep requer "validationResult" previamente populado no contexto.');
    }

    // Se o registro não for válido, ignora a execução do mapeamento (retorna contexto inalterado)
    if (!context.validationResult.valid) {
      return { ...context };
    }

    const mapper = this.customMapper || MapperService;
    const mappedRecord = await mapper.map(context.validationResult);

    return {
      ...context,
      mappedRecord,
    };
  }
}

