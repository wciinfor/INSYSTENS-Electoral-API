import { NormalizedRecord } from './NormalizedRecord';

export interface ValidationResult {
  valid: boolean; // true se não houver erros
  score: number; // pontuação de qualidade de 0 a 100
  warnings: string[]; // lista de avisos estruturais
  errors: string[]; // lista de falhas/erros críticos
  record: NormalizedRecord; // o registro original analisado
}
