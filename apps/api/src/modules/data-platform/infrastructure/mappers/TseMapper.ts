import { ValidationResult } from '../../domain/ValidationResult';
import { MappedRecord } from '../../domain/MappedRecord';
import { Mapper } from '../../domain/Mapper';
import { EntityDetector } from './EntityDetector';

export class TseMapper implements Mapper {
  
  canMap(source: string): boolean {
    return source.toLowerCase().includes('tse');
  }

  async map(validationResult: ValidationResult): Promise<MappedRecord> {
    const { source, data, metadata } = validationResult.record;

    // Detecta o tipo de entidade conceitual usando o classificador isolado
    const { entity, confidence } = EntityDetector.detect(source, data, metadata);

    return {
      source,
      entity,
      data,
      confidence,
      metadata,
    };
  }
}
