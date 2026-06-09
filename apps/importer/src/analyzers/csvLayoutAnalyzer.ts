import fs from 'fs';
import readline from 'readline';
import { detectDelimiter } from '../loaders/csvStream';

export interface LayoutAnalysisResult {
  filePath: string;
  fileSizeMb: number;
  delimiter: ';' | ',';
  totalColumns: number;
  columns: string[];
  samples: Record<string, string[]>;
  probableEncoding: string;
}

/**
 * Heurística simples para adivinhar a codificação do arquivo CSV (UTF-8 ou ISO-8859-1).
 */
export async function detectEncoding(filePath: string): Promise<string> {
  return new Promise((resolve) => {
    const bufferSize = 4096;
    const buffer = Buffer.alloc(bufferSize);
    
    fs.open(filePath, 'r', (err, fd) => {
      if (err) {
        resolve('Desconhecido (Erro ao abrir)');
        return;
      }

      fs.read(fd, buffer, 0, bufferSize, 0, (err, bytesRead) => {
        fs.close(fd, () => {});

        if (err || bytesRead === 0) {
          resolve('Desconhecido');
          return;
        }

        // Verifica UTF-8 BOM (Byte Order Mark: EF BB BF)
        if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
          resolve('UTF-8 com BOM');
          return;
        }

        // Tenta decodificar o buffer em UTF-8 e verifica se há sequências inválidas
        const text = buffer.toString('utf8');
        let isValidUtf8 = true;
        
        // Caracteres comuns em ISO-8859-1 com acentuações inválidas em UTF-8 aparecem como caracteres de substituição ( ou \uFFFD)
        if (text.includes('\uFFFD')) {
          isValidUtf8 = false;
        }

        resolve(isValidUtf8 ? 'UTF-8' : 'ISO-8859-1 (Latin-1)');
      });
    });
  });
}

/**
 * Analisa o cabeçalho e as primeiras 20 linhas de um arquivo CSV para descrever seu layout.
 */
export async function analyzeCsvLayout(filePath: string): Promise<LayoutAnalysisResult> {
  const stats = fs.statSync(filePath);
  const fileSizeMb = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
  
  const delimiter = await detectDelimiter(filePath);
  const probableEncoding = await detectEncoding(filePath);

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    let columns: string[] = [];
    const samples: Record<string, string[]> = {};

    rl.on('line', (line) => {
      lineCount++;

      // Quebra a linha respeitando o delimitador
      const parsedRow = line.split(delimiter).map(col => col.replace(/^"|"$/g, '').trim());

      if (lineCount === 1) {
        columns = parsedRow;
        columns.forEach(col => {
          samples[col] = [];
        });
      } else if (lineCount <= 21) { // Coleta amostras das 20 primeiras linhas de dados
        parsedRow.forEach((val, idx) => {
          const colName = columns[idx];
          if (colName && val) {
            // Guarda valores únicos para exemplificar
            if (!samples[colName].includes(val) && samples[colName].length < 3) {
              samples[colName].push(val);
            }
          }
        });
      }

      if (lineCount > 21) {
        rl.close();
      }
    });

    rl.on('close', () => {
      resolve({
        filePath,
        fileSizeMb,
        delimiter,
        totalColumns: columns.length,
        columns,
        samples,
        probableEncoding
      });
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}
