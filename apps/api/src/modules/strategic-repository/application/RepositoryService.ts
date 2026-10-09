import { RepositoryRegistry } from './RepositoryRegistry';
import { RepositoryRecord } from '../domain/RepositoryRecord';
import { Repository } from '../domain/Repository';

export class RepositoryService {
  private static getRepository(repositoryId?: string): Repository {
    if (repositoryId) {
      const repo = RepositoryRegistry.find(repositoryId);
      if (!repo) {
        throw new Error(`Repository "${repositoryId}" não encontrado.`);
      }
      return repo;
    }

    const all = RepositoryRegistry.list();
    if (all.length === 0) {
      throw new Error('Nenhum Repository registrado no sistema.');
    }
    return all[0];
  }

  static async store(record: RepositoryRecord, repositoryId?: string): Promise<void> {
    const repo = this.getRepository(repositoryId);
    const start = Date.now();

    await repo.store(record);
    const duration = Date.now() - start;

    const count = await repo.count();

    console.log(
      JSON.stringify({
        repository: repo.manifest.id,
        entity: record.entity,
        operation: 'store',
        elapsedTime: duration,
        recordCount: count,
      })
    );
  }

  static async find(id: string, repositoryId?: string): Promise<RepositoryRecord | undefined> {
    const repo = this.getRepository(repositoryId);
    const start = Date.now();

    const record = await repo.find(id);
    const duration = Date.now() - start;

    const count = await repo.count();

    console.log(
      JSON.stringify({
        repository: repo.manifest.id,
        entity: record ? record.entity : 'unknown',
        operation: 'find',
        elapsedTime: duration,
        recordCount: count,
      })
    );

    return record;
  }

  static async findByEntity(entity: string, repositoryId?: string): Promise<RepositoryRecord[]> {
    const repo = this.getRepository(repositoryId);
    const start = Date.now();

    const records = await repo.findByEntity(entity);
    const duration = Date.now() - start;

    const count = await repo.count();

    console.log(
      JSON.stringify({
        repository: repo.manifest.id,
        entity,
        operation: 'findByEntity',
        elapsedTime: duration,
        recordCount: count,
      })
    );

    return records;
  }

  static async count(repositoryId?: string): Promise<number> {
    const repo = this.getRepository(repositoryId);
    const start = Date.now();

    const c = await repo.count();
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        repository: repo.manifest.id,
        entity: 'all',
        operation: 'count',
        elapsedTime: duration,
        recordCount: c,
      })
    );

    return c;
  }

  static async clear(repositoryId?: string): Promise<void> {
    const repo = this.getRepository(repositoryId);
    const start = Date.now();

    await repo.clear();
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        repository: repo.manifest.id,
        entity: 'all',
        operation: 'clear',
        elapsedTime: duration,
        recordCount: 0,
      })
    );
  }
}
