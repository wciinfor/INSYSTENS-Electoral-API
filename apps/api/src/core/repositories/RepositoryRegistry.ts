import { IntelligenceRepository } from './interfaces/IntelligenceRepository';

export type RepositoryConstructor = new () => IntelligenceRepository;

export class RepositoryRegistry {
  private static registry = new Map<string, RepositoryConstructor>();

  static register(provider: string, ctor: RepositoryConstructor) {
    this.registry.set(provider.toLowerCase(), ctor);
  }

  static get(provider: string): RepositoryConstructor | undefined {
    return this.registry.get(provider.toLowerCase());
  }
}
