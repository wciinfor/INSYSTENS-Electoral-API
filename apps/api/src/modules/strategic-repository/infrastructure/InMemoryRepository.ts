import { Repository } from '../domain/Repository';
import { RepositoryManifest } from '../domain/RepositoryManifest';
import { RepositoryRecord } from '../domain/RepositoryRecord';

export class InMemoryRepository implements Repository {
  private storeMap = new Map<string, RepositoryRecord>();
  public tenantId: string;

  constructor(public manifest: RepositoryManifest, tenantId: string = 'default') {
    this.tenantId = tenantId;
  }

  async store(record: RepositoryRecord): Promise<void> {
    const recordTenantId =
      record.metadata && typeof record.metadata.tenantId === 'string'
        ? record.metadata.tenantId
        : this.tenantId;

    // A chave interna isola pelo tenant, mantendo record.id inalterado
    const compositeKey = `${recordTenantId}:${record.id}`;
    this.storeMap.set(compositeKey, record);
  }

  async find(id: string): Promise<RepositoryRecord | undefined> {
    const compositeKey = `${this.tenantId}:${id}`;
    return this.storeMap.get(compositeKey);
  }

  async getById(id: string): Promise<RepositoryRecord | undefined> {
    return this.find(id);
  }

  async list(): Promise<RepositoryRecord[]> {
    const records: RepositoryRecord[] = [];
    const prefix = `${this.tenantId}:`;
    for (const [key, record] of this.storeMap.entries()) {
      if (key.startsWith(prefix)) {
        records.push(record);
      }
    }
    return records;
  }

  async exists(id: string): Promise<boolean> {
    const compositeKey = `${this.tenantId}:${id}`;
    return this.storeMap.has(compositeKey);
  }

  async findByEntity(entity: string): Promise<RepositoryRecord[]> {
    const records: RepositoryRecord[] = [];
    const prefix = `${this.tenantId}:`;
    for (const [key, record] of this.storeMap.entries()) {
      if (key.startsWith(prefix) && record.entity === entity) {
        records.push(record);
      }
    }
    return records;
  }

  async count(): Promise<number> {
    let total = 0;
    const prefix = `${this.tenantId}:`;
    for (const key of this.storeMap.keys()) {
      if (key.startsWith(prefix)) {
        total++;
      }
    }
    return total;
  }

  async clear(): Promise<void> {
    const prefix = `${this.tenantId}:`;
    for (const key of Array.from(this.storeMap.keys())) {
      if (key.startsWith(prefix)) {
        this.storeMap.delete(key);
      }
    }
  }
}
