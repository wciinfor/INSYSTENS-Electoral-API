import fs from 'fs';
import readline from 'readline';

/**
 * Detecta o delimitador do CSV analisando a primeira linha do arquivo.
 * Escolhe entre ponto e vírgula (;) e vírgula (,).
 */
export async function detectDelimiter(filePath: string): Promise<';' | ','> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', start: 0, end: 2048 });
    let buffer = '';

    stream.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.includes('\n') || buffer.includes('\r')) {
        stream.destroy(); // Fecha o stream assim que leu a primeira linha
      }
    });

    stream.on('error', (err) => {
      reject(err);
    });

    stream.on('close', () => {
      const firstLine = buffer.split(/[\r\n]+/)[0];
      const semicolons = (firstLine.match(/;/g) || []).length;
      const commas = (firstLine.match(/,/g) || []).length;
      resolve(semicolons >= commas ? ';' : ',');
    });
  });
}

/**
 * Lê o arquivo CSV em stream linha a linha gerando baixo consumo de memória.
 */
export async function processCsvInStream(
  filePath: string,
  delimiter: ';' | ',',
  onRow: (row: string[], lineIndex: number) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineCount = 0;

    rl.on('line', (line) => {
      lineCount++;
      
      // Quebra a linha respeitando o delimitador
      // Nota: Esta é uma divisão simples para o MVP. Em ambiente real trata-se aspas de texto.
      const columns = line.split(delimiter).map(col => col.replace(/^"|"$/g, '').trim());
      
      onRow(columns, lineCount);
    });

    rl.on('close', () => {
      resolve(lineCount);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}
