import { ImportSession } from '../domain/ImportSession';

export class ImportSessionRegistry {
  private static sessions = new Map<string, ImportSession>();

  /**
   * Adiciona uma nova sessão de importação
   */
  static add(session: ImportSession): void {
    this.sessions.set(session.id, session);
  }

  /**
   * Busca uma sessão ativa por id
   */
  static get(id: string): ImportSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Atualiza os dados de uma sessão existente
   */
  static update(session: ImportSession): void {
    if (this.sessions.has(session.id)) {
      this.sessions.set(session.id, session);
    }
  }

  /**
   * Remove uma sessão por id
   */
  static delete(id: string): void {
    this.sessions.delete(id);
  }

  /**
   * Retorna a lista de todas as sessões registradas
   */
  static list(): ImportSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Limpa o registro das sessões
   */
  static clear(): void {
    this.sessions.clear();
  }
}
