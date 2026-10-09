import { ImportSession } from './ImportSession';
import { IngestionRecord } from './IngestionRecord';
import { NormalizedRecord } from './NormalizedRecord';
import { ValidationResult } from './ValidationResult';
import { MappedRecord } from './MappedRecord';

export interface PipelineContext {
  session: ImportSession;
  ingestionRecord?: IngestionRecord;
  normalizedRecord?: NormalizedRecord;
  validationResult?: ValidationResult;
  mappedRecord?: MappedRecord;
  metadata?: Record<string, any>;
}
