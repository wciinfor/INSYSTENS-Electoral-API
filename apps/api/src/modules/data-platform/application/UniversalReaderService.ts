import { IngestionRecord } from '../domain/IngestionRecord';
import { ReaderRegistry } from './ReaderRegistry';
import { CsvReader } from '../infrastructure/readers/CsvReader';
import { JsonReader } from '../infrastructure/readers/JsonReader';

// Auto-registro dos leitores padrão
ReaderRegistry.register('csv', new CsvReader());
ReaderRegistry.register('json', new JsonReader());


export class UniversalReaderService {
  /**
   * Executa a leitura de uma fonte de dados de maneira automatizada,
   * identificando o leitor adequado no ReaderRegistry e emitindo logs de observabilidade ao final.
   */
  static async *read(source: string): AsyncGenerator<IngestionRecord> {
    const startTime = Date.now();
    let recordsRead = 0;
    
    // 1. Localizar o leitor correspondente no ReaderRegistry
    const reader = ReaderRegistry.find(source);

    if (!reader) {
      const errorMsg = `Nenhum leitor registrado foi capaz de ler a fonte: "${source}"`;
      this.logObservability({
        reader: 'None',
        provider: source,
        elapsedTime: Date.now() - startTime,
        recordsRead: 0,
        error: errorMsg,
      });
      throw new Error(errorMsg);
    }

    const readerName = reader.constructor.name;

    try {
      // 2. Executar leitura por streaming através do AsyncGenerator
      for await (const record of reader.read(source)) {
        recordsRead++;
        yield record;
      }

      // 3. Log de sucesso ao final do streaming
      this.logObservability({
        reader: readerName,
        provider: source,
        elapsedTime: Date.now() - startTime,
        recordsRead,
      });
    } catch (err: any) {
      // 3. Log de erro durante a leitura
      const elapsedTime = Date.now() - startTime;
      this.logObservability({
        reader: readerName,
        provider: source,
        elapsedTime,
        recordsRead,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Log estruturado de observabilidade
   */
  private static logObservability(log: {
    reader: string;
    provider: string;
    elapsedTime: number;
    recordsRead: number;
    error?: string;
  }): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'data_platform_ingestion_read',
        level: log.error ? 'ERROR' : 'INFO',
        ...log,
      })
    );
  }
}
