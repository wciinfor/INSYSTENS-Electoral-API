import { ValidationResult } from '../domain/ValidationResult';
import { MappedRecord } from '../domain/MappedRecord';
import { MapperRegistry } from './MapperRegistry';
import { GenericMapper } from '../infrastructure/mappers/GenericMapper';
import { TseMapper } from '../infrastructure/mappers/TseMapper';

// Auto-registro dos mappers padrão
MapperRegistry.register('generic', new GenericMapper());
MapperRegistry.register('tse', new TseMapper());

export class MapperService {
  /**
   * Mapeia um ValidationResult localizando o mapeador adequado no registry
   */
  static async map(validationResult: ValidationResult): Promise<MappedRecord> {
    const startTime = Date.now();
    const source = validationResult.record.source;
    
    const mapper = MapperRegistry.find(source);

    if (!mapper) {
      const errorMsg = `Nenhum mapeador registrado foi capaz de mapear o registro com fonte: "${source}"`;
      this.logObservability({
        mapper: 'None',
        entity: 'generic',
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 0,
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }

    const mapperName = mapper.constructor.name;

    try {
      const result = await mapper.map(validationResult);
      
      this.logObservability({
        mapper: mapperName,
        entity: result.entity,
        elapsedTime: Date.now() - startTime,
        recordsProcessed: 1,
      });

      return result;
    } catch (err: any) {
      this.logObservability({
        mapper: mapperName,
        entity: 'generic',
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
    mapper: string;
    entity: string;
    elapsedTime: number;
    recordsProcessed: number;
    error?: string;
  }): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'data_platform_mapping',
        level: log.error ? 'ERROR' : 'INFO',
        ...log,
      })
    );
  }
}
