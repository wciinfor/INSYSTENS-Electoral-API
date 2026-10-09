import { IngestionRecord } from '../../domain/IngestionRecord';
import { NormalizedRecord } from '../../domain/NormalizedRecord';
import { Normalizer } from '../../domain/Normalizer';

/**
 * GenericNormalizer - Normalizador padrão de registros brutos.
 * 
 * Executa padronizações como camelCase nas chaves, trim de espaços,
 * conversão para nulo, booleano, números (sem zeros à esquerda) e datas (YYYY-MM-DD / DD/MM/YYYY).
 */
export class GenericNormalizer implements Normalizer {
  
  canNormalize(source: string): boolean {
    // Pode normalizar qualquer fonte genérica
    return !source.toLowerCase().includes('tse');
  }

  async normalize(record: IngestionRecord): Promise<NormalizedRecord> {
    const rawData = record.raw;
    const normalizedData: Record<string, any> = {};

    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      for (const [key, value] of Object.entries(rawData)) {
        const normalizedKey = this.toCamelCase(key);
        normalizedData[normalizedKey] = this.normalizeValue(value);
      }
    } else {
      // Se não for um objeto regular, coloca em um campo 'value'
      normalizedData['value'] = this.normalizeValue(rawData);
    }

    return {
      source: record.source,
      line: record.line,
      data: normalizedData,
      metadata: record.metadata,
    };
  }

  /**
   * Converte uma chave string para camelCase
   */
  private toCamelCase(key: string): string {
    return key
      .trim()
      .replace(/[^a-zA-Z0-9_-\s]/g, '') // Remove caracteres especiais inválidos
      .toLowerCase()
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  }

  /**
   * Normaliza os valores de acordo com as diretrizes do projeto
   */
  private normalizeValue(val: any): any {
    if (val === null || val === undefined) {
      return null;
    }

    if (typeof val === 'string') {
      const trimmed = val.trim();

      // 1. String vazia vira nulo
      if (trimmed === '') {
        return null;
      }

      // 2. Booleanos
      if (trimmed.toLowerCase() === 'true') return true;
      if (trimmed.toLowerCase() === 'false') return false;

      // 3. Datas conservadoras
      const parsedDate = this.parseDate(trimmed);
      if (parsedDate !== null) {
        return parsedDate;
      }

      // 4. Números
      const parsedNum = this.parseNumber(trimmed);
      if (parsedNum !== trimmed) {
        return parsedNum;
      }

      return trimmed;
    }

    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return val.map(item => this.normalizeValue(item));
      }
      const normalizedObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        normalizedObj[this.toCamelCase(k)] = this.normalizeValue(v);
      }
      return normalizedObj;
    }

    return val;
  }

  /**
   * Valida e converte números mantendo zeros à esquerda intactos
   */
  private parseNumber(val: string): number | string {
    let cleaned = val.replace(/\s/g, '');

    // Trata formato brasileiro (ex: 1.234,56 ou 123,45)
    if (cleaned.includes('.') && cleaned.includes(',') && cleaned.indexOf('.') < cleaned.indexOf(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(/,/g, '.');
    }

    // Valida se é um formato numérico válido
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
      return val;
    }

    // Regra: Números com zeros à esquerda (comprimento > 1 e não decimal 0.xxx) permanecem string
    if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
      return val;
    }

    const num = Number(cleaned);
    return isNaN(num) ? val : num;
  }

  /**
   * Converte strings contendo datas válidas YYYY-MM-DD ou DD/MM/YYYY para ISOString
   */
  private parseDate(val: string): string | null {
    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const brPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    let year = 0;
    let month = 0;
    let day = 0;

    if (isoPattern.test(val)) {
      const match = val.match(isoPattern)!;
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
    } else if (brPattern.test(val)) {
      const match = val.match(brPattern)!;
      day = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      year = parseInt(match[3], 10);
    } else {
      return null;
    }

    // Limites de calendário básicos
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Validação real de calendário (ex: leap years)
    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day
    ) {
      // Usar meio-dia UTC para evitar problemas de fuso horário local
      testDate.setUTCHours(12, 0, 0, 0);
      return testDate.toISOString();
    }

    return null;
  }
}
