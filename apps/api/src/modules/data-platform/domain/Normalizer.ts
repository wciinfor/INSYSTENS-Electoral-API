import { IngestionRecord } from './IngestionRecord';
import { NormalizedRecord } from './NormalizedRecord';

export interface Normalizer {
  canNormalize(source: string): boolean;
  normalize(record: IngestionRecord): Promise<NormalizedRecord>;
}
