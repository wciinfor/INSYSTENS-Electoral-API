import { PipelineStep } from '../../domain/PipelineStep';
import { PipelineContext } from '../../domain/PipelineContext';
import { UniversalReaderService } from '../../application/UniversalReaderService';
import { Reader } from '../../domain/Reader';

export class ReaderStep implements PipelineStep {
  constructor(private customReader?: Reader<any, any>) {}

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (context.ingestionRecord) {
      return { ...context };
    }

    const source = context.metadata?.source || context.session.provider;
    if (!source) {
      throw new Error('ReaderStep requer source definido em metadata.source ou session.provider.');
    }

    // Consome apenas 1 registro individual do stream de leitura por contexto
    const reader = this.customReader || UniversalReaderService;
    for await (const record of reader.read(source)) {
      return {
        ...context,
        ingestionRecord: record,
      };
    }

    throw new Error(`Nenhum registro retornado da fonte de leitura: "${source}"`);
  }
}

