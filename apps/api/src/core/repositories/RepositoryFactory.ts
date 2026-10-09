import { RepositoryRegistry } from './RepositoryRegistry';
import { IntelligenceRepository } from './interfaces/IntelligenceRepository';

// Importações para garantir o auto-registro dos repositórios
import './implementations/MockIntelligenceRepository';
import './implementations/PrismaIntelligenceRepository';

export class RepositoryFactory {
  static create(provider: string): IntelligenceRepository {
    const Ctor = RepositoryRegistry.get(provider);
    if (!Ctor) {
      throw new Error(`Nenhum repositório de inteligência registrado para o provider: ${provider}`);
    }
    return new Ctor();
  }
}
