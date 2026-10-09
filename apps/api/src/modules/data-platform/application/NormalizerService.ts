import { IngestionRecord } from '../domain/IngestionRecord';
import { NormalizedRecord } from '../domain/NormalizedRecord';
import { NormalizerRegistry } from './NormalizerRegistry';
import { GenericNormalizer } from '../infrastructure/normalizers/GenericNormalizer';
import { TseNormalizer } from '../infrastructure/normalizers/TseNormalizer';

// Auto-registro dos normalizadores padrão
NormalizerRegistry.register('generic', new GenericNormalizer());
NormalizerRegistry.register('tse', new TseNormalizer());

export class NormalizerService {
  /**
   * Normaliza um único IngestionRecord localizando o normalizador no registry
   */
  static async normalize(record: IngestionRecord): Promise<NormalizedRecord> {
    const startTime = Date.now();
    
    // Tenta encontrar pelo source do registro
    const normalizer = NormalizerRegistry.find(record.source);

    if (!normalizer) {
      const errorMsg = `Nenhum normalizador registrado foi capaz de normalizar o registro com fonte: "${record.source}"`;
      this.logObservability({
        normalizer: 'None',
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 0,
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }

    const normalizerName = normalizer.constructor.name;

    try {
      const normalized = await normalizer.normalize(record);
      
      this.logObservability({
        normalizer: normalizerName,
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 1,
      });

      return normalized;
    } catch (err: any) {
      this.logObservability({
        normalizer: normalizerName,
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 0,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Log estruturado de observabilidade
   */
  private static logObservability(log: {
    normalizer: string;
    elapsedTime: number;
    recordsProcessed: number;
    error?: string;
  }): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'data_platform_normalization',
        level: log.error ? 'ERROR' : 'INFO',
        ...log,
      })
    );
  }
}
