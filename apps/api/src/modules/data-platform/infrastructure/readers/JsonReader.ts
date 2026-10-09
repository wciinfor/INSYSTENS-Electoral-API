import * as fs from 'fs';
import * as readline from 'readline';
import { Reader } from '../../domain/Reader';
import { IngestionRecord } from '../../domain/IngestionRecord';

export class JsonReader implements Reader<string, IngestionRecord> {
  
  canRead(source: string): boolean {
    if (typeof source !== 'string') return false;
    return (
      source.toLowerCase().endsWith('.json') || 
      source.toLowerCase().endsWith('.ndjson') || 
      source.toLowerCase().includes('json')
    );
  }

  async *read(source: string): AsyncGenerator<IngestionRecord> {
    let lineCount = 0;
    const isFileLike = source.toLowerCase().endsWith('.json') || source.toLowerCase().endsWith('.ndjson');
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
      // Detecta se o arquivo é no formato NDJSON (JSON delimitado por quebra de linha)
      const isNdJson = source.toLowerCase().endsWith('.ndjson') || await this.detectNdjsonFile(source);

      if (isNdJson) {
        const fileStream = fs.createReadStream(source, 'utf8');
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        });

        for await (const line of rl) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          lineCount++;
          try {
            const parsed = JSON.parse(trimmed);
            yield {
              source: 'JsonReader',
              line: lineCount,
              raw: parsed,
              metadata: { filePath: source, format: 'NDJSON' },
            };
          } catch (err: any) {
            throw new Error(`Erro ao decodificar NDJSON na linha ${lineCount}: ${err.message}`);
          }
        }
      } else {
        // Lê o arquivo JSON tradicional inteiro em memória (Array ou Objeto único)
        const content = fs.readFileSync(source, 'utf8').trim();
        yield* this.parseAndYieldJsonContent(content, source);
      }
    } else {
      // Conteúdo JSON direto em string/memória
      yield* this.parseAndYieldJsonContent(source.trim(), 'memory');
    }
  }

  /**
   * Tenta detectar de forma eficiente se um arquivo físico segue o padrão NDJSON
   */
  private async detectNdjsonFile(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const stream = fs.createReadStream(filePath, { start: 0, end: 1024 });
      let data = '';
      stream.on('data', chunk => {
        data += chunk.toString();
      });
      stream.on('end', () => {
        const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length > 1 && lines.every(l => l.trim().startsWith('{') && l.trim().endsWith('}'))) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      stream.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Processa o texto JSON bruto dependendo se for Array, Objeto ou NDJSON
   */
  private async *parseAndYieldJsonContent(content: string, sourceName: string): AsyncGenerator<IngestionRecord> {
    if (!content) return;

    if (content.startsWith('[') && content.endsWith(']')) {
      try {
        const array = JSON.parse(content);
        if (Array.isArray(array)) {
          let itemIndex = 0;
          for (const item of array) {
            itemIndex++;
            yield {
              source: 'JsonReader',
              line: itemIndex,
              raw: item,
              metadata: { source: sourceName, format: 'Array' },
            };
          }
        }
      } catch (err: any) {
        throw new Error(`Erro ao decodificar Array JSON: ${err.message}`);
      }
    } else if (content.startsWith('{') && content.endsWith('}')) {
      try {
        const parsed = JSON.parse(content);
        yield {
          source: 'JsonReader',
          line: 1,
          raw: parsed,
          metadata: { source: sourceName, format: 'SingleObject' },
        };
      } catch (err: any) {
        throw new Error(`Erro ao decodificar objeto JSON único: ${err.message}`);
      }
    } else {
      // NDJSON em memória (linhas de strings JSON)
      const lines = content.split(/\r?\n/);
      let lineIndex = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        lineIndex++;
        try {
          const parsed = JSON.parse(trimmed);
          yield {
            source: 'JsonReader',
            line: lineIndex,
            raw: parsed,
            metadata: { source: sourceName, format: 'NDJSON_In_Memory' },
          };
        } catch (err: any) {
          throw new Error(`Erro ao decodificar NDJSON na linha ${lineIndex}: ${err.message}`);
        }
      }
    }
  }
}
