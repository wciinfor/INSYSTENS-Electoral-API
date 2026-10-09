import { RepositoryManifest } from './RepositoryManifest';
import { RepositoryRecord } from './RepositoryRecord';

export interface Repository {
  manifest: RepositoryManifest;
  store(record: RepositoryRecord): Promise<void>;
  find(id: string): Promise<RepositoryRecord | undefined>;
  getById?(id: string): Promise<RepositoryRecord | undefined>;
  list?(): Promise<RepositoryRecord[]>;
  exists?(id: string): Promise<boolean>;
  findByEntity(entity: string): Promise<RepositoryRecord[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

