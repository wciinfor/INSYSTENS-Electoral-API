import { EntityType } from './EntityType';

export interface MappedRecord {
  source: string; // identificação do provedor/arquivo original
  entity: EntityType; // tipo de entidade detectada
  data: Record<string, any>; // dados normalizados e organizados
  confidence: number; // grau de confiança (0.0 a 1.0) na classificação da entidade
  metadata?: Record<string, any>; // metadados adicionais herdados
}
