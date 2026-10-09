export interface NormalizedRecord {
  source: string; // identificação do provider/arquivo de origem
  line: number; // posição original do registro
  data: Record<string, any>; // dados normalizados
  metadata?: Record<string, any>; // informações auxiliares herdadas ou adicionais
}
