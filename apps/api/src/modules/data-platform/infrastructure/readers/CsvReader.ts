import * as fs from 'fs';
import * as readline from 'readline';
import { Reader } from '../../domain/Reader';
import { IngestionRecord } from '../../domain/IngestionRecord';

/**
 * CsvReader - Leitor de arquivos CSV e fluxos de texto por streaming.
 * 
 * LIMITAÇÕES INICIAIS:
 * - Parser simples de linha a linha com suporte a delimitadores comuns (, ou ;).
 * - Não possui suporte completo para valores entre aspas contendo quebras de linha físicas internas.
 * - Não suporta caracteres especiais de escape aninhados de forma avançada.
 * - Assume que a primeira linha não vazia do arquivo representa o cabeçalho.
 */
export class CsvReader implements Reader<string, IngestionRecord> {
  
  canRead(source: string): boolean {
    if (typeof source !== 'string') return false;
    // Identifica se a string aponta para um arquivo .csv ou se possui a keyword csv no contexto do provedor
    return source.toLowerCase().endsWith('.csv') || source.toLowerCase().includes('csv');
  }

  async *read(source: string): AsyncGenerator<IngestionRecord> {
    let lineCount = 0;
    let headers: string[] = [];

    const isFileLike = source.toLowerCase().endsWith('.csv');
    let isFilePath = false;
    try {
      isFilePath = fs.existsSync(source) && fs.statSync(source).isFile();
    } catch {
      isFilePath = false;
    }

    if (isFileLike && !isFilePath) {
      throw new Error(`Arquivo não encontrado: "${source}"`);
    }

    if (isFilePath) {
      const fileStream = fs.createReadStream(source, 'utf8');
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        lineCount++;

        if (lineCount === 1) {
          headers = this.parseCsvLine(line);
          continue;
        }

        const values = this.parseCsvLine(line);
        const record = this.buildRecord(headers, values);

        yield {
          source: 'CsvReader',
          line: lineCount,
          raw: record,
          metadata: { filePath: source },
        };
      }
    } else {
      // Processamento de string em memória
      const lines = source.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        lineCount++;

        if (lineCount === 1) {
          headers = this.parseCsvLine(line);
          continue;
        }

        const values = this.parseCsvLine(line);
        const record = this.buildRecord(headers, values);

        yield {
          source: 'CsvReader',
          line: lineCount,
          raw: record,
          metadata: { type: 'memory_string' },
        };
      }
    }
  }

  /**
   * Divide a linha baseado no delimitador detectado (, ou ;)
   */
  private parseCsvLine(line: string): string[] {
    const delimiter = line.includes(';') ? ';' : ',';
    return line.split(delimiter).map(val => {
      // Remove aspas simples ou duplas envolventes nos valores
      return val.trim().replace(/^["']|["']$/g, '');
    });
  }

  /**
   * Constrói o registro associando valores às chaves de cabeçalho
   */
  private buildRecord(headers: string[], values: string[]): Record<string, string> {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header || `col_${idx}`] = values[idx] !== undefined ? values[idx] : '';
    });
    return record;
  }
}
