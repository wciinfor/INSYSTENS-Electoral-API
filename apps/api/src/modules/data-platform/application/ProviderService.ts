import { ProviderRegistry } from './ProviderRegistry';
import { ImportSessionService } from './ImportSessionService';
import { PipelineBuilder } from './PipelineBuilder';
import { ReaderStep } from '../infrastructure/steps/ReaderStep';
import { NormalizerStep } from '../infrastructure/steps/NormalizerStep';
import { ValidatorStep } from '../infrastructure/steps/ValidatorStep';
import { MapperStep } from '../infrastructure/steps/MapperStep';
import { PipelineContext } from '../domain/PipelineContext';
import { MappedRecord } from '../domain/MappedRecord';
import { TseProvider } from '../infrastructure/providers/TseProvider';

// Auto-registro dos provedores padrão
ProviderRegistry.register(new TseProvider());

export class ProviderService {

  /**
   * Localiza um provedor, monta o pipeline correspondente, inicia e gerencia uma ImportSession,
   * executa o processamento do registro e retorna o MappedRecord resultante.
   */
  static async processRecord(
    providerId: string,
    source: string,
    metadata?: Record<string, any>
  ): Promise<MappedRecord | null> {
    const provider = ProviderRegistry.find(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" não encontrado.`);
    }

    const session = ImportSessionService.create(providerId, metadata);
    ImportSessionService.start(session.id);

    const startTime = Date.now();

    // Montar o Pipeline usando os componentes injetados do Provedor
    const pipeline = new PipelineBuilder()
      .add(new ReaderStep(provider.reader))
      .add(new NormalizerStep(provider.normalizer))
      .add(new ValidatorStep(provider.validator))
      .add(new MapperStep(provider.mapper))
      .build();

    const initialContext: PipelineContext = {
      session,
      metadata: {
        ...(metadata || {}),
        source,
      },
    };

    try {
      const finalContext = await pipeline.run(initialContext);
      const elapsedTime = Date.now() - startTime;

      const validationScore = finalContext.validationResult?.score ?? 0;
      const confidence = finalContext.mappedRecord?.confidence ?? 0;
      const entity = finalContext.mappedRecord?.entity ?? 'generic';

      const skipped = finalContext.validationResult && !finalContext.validationResult.valid;

      ImportSessionService.complete(session.id);

      // Log estruturado de observabilidade exigido
      console.log(
        JSON.stringify({
          provider: providerId,
          version: provider.manifest.version,
          sessionId: session.id,
          entity,
          confidence,
          validationScore,
          elapsedTime,
          status: finalContext.mappedRecord ? 'SUCCESS' : (skipped ? 'SKIPPED' : 'FAILED'),
        })
      );

      return finalContext.mappedRecord || null;
    } catch (error: any) {
      const elapsedTime = Date.now() - startTime;

      console.log(
        JSON.stringify({
          provider: providerId,
          version: provider.manifest.version,
          sessionId: session.id,
          entity: 'generic',
          confidence: 0,
          validationScore: 0,
          elapsedTime,
          status: 'FAILED',
          error: error.message,
        })
      );

      throw error;
    }
  }
}

