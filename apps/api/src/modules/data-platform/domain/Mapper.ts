import { ValidationResult } from './ValidationResult';
import { MappedRecord } from './MappedRecord';

export interface Mapper {
  canMap(source: string): boolean;
  map(validationResult: ValidationResult): Promise<MappedRecord>;
}
