import { IngestionRecord } from './IngestionRecord';

export interface Reader<TSource = string, TResult = IngestionRecord> {
  canRead(source: TSource): boolean;
  read(source: TSource): AsyncGenerator<TResult>;
}
