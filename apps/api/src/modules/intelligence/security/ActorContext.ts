/**
 * Contexto de identidade do ator autenticado/autorizado.
 * Estritamente livre de senhas, chaves secretas ou tokens sensíveis.
 */
export interface ActorContext {
  tenantId: string;
  actorId: string;
  actorType: string; // Ex: 'PARLAMENTAR', 'PARTIDO', 'CONSULTORIA', 'SYSTEM'
  capabilities?: string[];
}
