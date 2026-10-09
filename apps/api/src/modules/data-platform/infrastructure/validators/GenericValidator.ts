import { NormalizedRecord } from '../../domain/NormalizedRecord';
import { ValidationResult } from '../../domain/ValidationResult';
import { Validator } from '../../domain/Validator';

/**
 * GenericValidator - Validador de conformidade estrutural básico.
 * 
 * Verifica a presença do provedor, linha do registro válida (>= 0), dados existentes e objeto não vazio.
 * Reporta até 10 warnings para campos nulos e calcula o score de qualidade.
 */
export class GenericValidator implements Validator {
  
  canValidate(source: string): boolean {
    return !source.toLowerCase().includes('tse');
  }

  async validate(record: NormalizedRecord): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validar source
    if (!record.source || typeof record.source !== 'string' || record.source.trim() === '') {
      errors.push('O campo "source" é obrigatório e não pode ser vazio.');
    }

    // 2. Validar line (rejeitar line ausente, não numérico ou menor que 0)
    if (
      record.line === undefined ||
      record.line === null ||
      typeof record.line !== 'number' ||
      isNaN(record.line) ||
      record.line < 0
    ) {
      errors.push('O campo "line" deve ser um número maior ou igual a zero.');
    }

    // 3. Validar data existente
    if (!record.data || typeof record.data !== 'object') {
      errors.push('O objeto de dados ("data") é obrigatório e deve ser existente.');
    } else {
      const keys = Object.keys(record.data);
      if (keys.length === 0) {
        errors.push('O objeto de dados ("data") está vazio.');
      } else {
        // 4. Reporta warnings para campos nulos (máximo de 10 warnings por registro)
        let nullCount = 0;
        for (const [key, value] of Object.entries(record.data)) {
          if (value === null || value === undefined) {
            if (nullCount < 10) {
              warnings.push(`O campo "${key}" está nulo ou indefinido.`);
            }
            nullCount++;
          }
        }
      }
    }

    // 5. Calcular score de qualidade: inicial 100, -20 por erro, -5 por warning. Mínimo 0.
    const penalty = errors.length * 20 + warnings.length * 5;
    const score = Math.max(0, 100 - penalty);

    return {
      valid: errors.length === 0,
      score,
      warnings,
      errors,
      record, // Mantém o record inalterado
    };
  }
}
