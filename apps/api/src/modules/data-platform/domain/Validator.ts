import { NormalizedRecord } from './NormalizedRecord';
import { ValidationResult } from './ValidationResult';

export interface Validator {
  canValidate(source: string): boolean;
  validate(record: NormalizedRecord): Promise<ValidationResult>;
}
