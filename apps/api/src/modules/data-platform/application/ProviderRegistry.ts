import { Provider } from '../domain/Provider';

export class ProviderRegistry {
  private static providers = new Map<string, Provider>();

  static register(provider: Provider): void {
    this.providers.set(provider.id, provider);
  }

  static find(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  static list(): Provider[] {
    return Array.from(this.providers.values());
  }

  static clear(): void {
    this.providers.clear();
  }
}
