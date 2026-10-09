import { Normalizer } from '../domain/Normalizer';

export class NormalizerRegistry {
  private static registry = new Map<string, Normalizer>();

  /**
   * Registra um novo normalizador no registro global
   */
  static register(key: string, normalizer: Normalizer): void {
    this.registry.set(key.toLowerCase(), normalizer);
  }

  /**
   * Encontra o normalizador adequado baseado na fonte identificada
   */
  static find(source: string): Normalizer | undefined {
    for (const normalizer of this.registry.values()) {
      if (normalizer.canNormalize(source)) {
        return normalizer;
      }
    }
    return undefined;
  }

  /**
   * Busca um normalizador diretamente por sua chave identificadora (ex: 'tse', 'generic')
   */
  static get(key: string): Normalizer | undefined {
    return this.registry.get(key.toLowerCase());
  }

  /**
   * Lista todos os normalizadores registrados
   */
  static list(): { key: string; normalizer: Normalizer }[] {
    const items: { key: string; normalizer: Normalizer }[] = [];
    this.registry.forEach((normalizer, key) => {
      items.push({ key, normalizer });
    });
    return items;
  }

  /**
   * Limpa o registro
   */
  static clear(): void {
    this.registry.clear();
  }
}
