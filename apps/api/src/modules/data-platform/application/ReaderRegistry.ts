import { Reader } from '../domain/Reader';

export class ReaderRegistry {
  private static registry = new Map<string, Reader<any, any>>();

  /**
   * Registra um novo leitor no registro global
   */
  static register(key: string, reader: Reader<any, any>): void {
    this.registry.set(key.toLowerCase(), reader);
  }

  /**
   * Encontra o primeiro leitor que declare conseguir ler a fonte especificada
   */
  static find(source: any): Reader<any, any> | undefined {
    for (const reader of this.registry.values()) {
      if (reader.canRead(source)) {
        return reader;
      }
    }
    return undefined;
  }

  /**
   * Busca um leitor diretamente por sua chave identificadora (ex: 'csv', 'json')
   */
  static get(key: string): Reader<any, any> | undefined {
    return this.registry.get(key.toLowerCase());
  }

  /**
   * Lista todos os leitores registrados
   */
  static list(): { key: string; reader: Reader<any, any> }[] {
    const items: { key: string; reader: Reader<any, any> }[] = [];
    this.registry.forEach((reader, key) => {
      items.push({ key, reader });
    });
    return items;
  }

  /**
   * Limpa o registro (útil para testes isolados)
   */
  static clear(): void {
    this.registry.clear();
  }
}
