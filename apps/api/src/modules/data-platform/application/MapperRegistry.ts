import { Mapper } from '../domain/Mapper';

export class MapperRegistry {
  private static registry = new Map<string, Mapper>();

  /**
   * Registra um novo mapeador globalmente
   */
  static register(key: string, mapper: Mapper): void {
    this.registry.set(key.toLowerCase(), mapper);
  }

  /**
   * Busca o mapeador correto para uma dada fonte/provedor
   */
  static find(source: string): Mapper | undefined {
    for (const mapper of this.registry.values()) {
      if (mapper.canMap(source)) {
        return mapper;
      }
    }
    return undefined;
  }

  /**
   * Obtém um mapeador diretamente pela sua chave identificadora (ex: 'generic', 'tse')
   */
  static get(key: string): Mapper | undefined {
    return this.registry.get(key.toLowerCase());
  }

  /**
   * Retorna a lista de mapeadores cadastrados
   */
  static list(): { key: string; mapper: Mapper }[] {
    const items: { key: string; mapper: Mapper }[] = [];
    this.registry.forEach((mapper, key) => {
      items.push({ key, mapper });
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
