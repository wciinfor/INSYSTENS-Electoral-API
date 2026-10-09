import { ValidationResult } from '../../domain/ValidationResult';
import { MappedRecord } from '../../domain/MappedRecord';
import { Mapper } from '../../domain/Mapper';

export class GenericMapper implements Mapper {
  
  canMap(source: string): boolean {
    return !source.toLowerCase().includes('tse');
  }

  async map(validationResult: ValidationResult): Promise<MappedRecord> {
    return {
      source: validationResult.record.source,
      entity: 'generic',
      data: validationResult.record.data,
      confidence: 1.0,
      metadata: validationResult.record.metadata,
    };
  }
}
