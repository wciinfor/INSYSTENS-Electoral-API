export interface IngestionRecord {
  source: string; // identificação do provider/arquivo de origem
  line: number; // posição/linha original do registro
  raw: Record<string, any> | string; // o registro bruto lido
  metadata?: Record<string, any>; // informações auxiliares (nome do arquivo, timestamp, etc.)
}
