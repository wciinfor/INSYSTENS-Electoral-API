import { Validator } from '../domain/Validator';

export class ValidatorRegistry {
  private static registry = new Map<string, Validator>();

  /**
   * Registra um novo validador globalmente
   */
  static register(key: string, validator: Validator): void {
    this.registry.set(key.toLowerCase(), validator);
  }

  /**
   * Encontra o validador correto para uma dada fonte/provider
   */
  static find(source: string): Validator | undefined {
    for (const validator of this.registry.values()) {
      if (validator.canValidate(source)) {
        return validator;
      }
    }
    return undefined;
  }

  /**
   * Obtém um validador pela sua chave identificadora (ex: 'generic', 'tse')
   */
  static get(key: string): Validator | undefined {
    return this.registry.get(key.toLowerCase());
  }

  /**
   * Retorna a lista de validadores cadastrados
   */
  static list(): { key: string; validator: Validator }[] {
    const items: { key: string; validator: Validator }[] = [];
    this.registry.forEach((validator, key) => {
      items.push({ key, validator });
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
