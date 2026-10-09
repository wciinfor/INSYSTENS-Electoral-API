import { Repository } from '../domain/Repository';

export class RepositoryRegistry {
  private static repositories = new Map<string, Repository>();

  static register(repository: Repository): void {
    if (this.repositories.has(repository.manifest.id)) {
      throw new Error(`Repository com manifest.id "${repository.manifest.id}" já está registrado.`);
    }
    this.repositories.set(repository.manifest.id, repository);
  }

  static find(id: string): Repository | undefined {
    return this.repositories.get(id);
  }

  static list(): Repository[] {
    return Array.from(this.repositories.values());
  }

  static clear(): void {
    this.repositories.clear();
  }
}
