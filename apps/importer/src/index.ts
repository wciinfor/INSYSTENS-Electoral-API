import fs from 'fs';
import path from 'path';
import { parseArgs } from './utils/args';
import { detectDelimiter, processCsvInStream } from './loaders/csvStream';
import { analyzeCsvLayout } from './analyzers/csvLayoutAnalyzer';

async function main() {
  const start = performance.now();
  console.log('=== INICIANDO IMPORTER TSE ===');

  try {
    const args = parseArgs();
    
    // Resolve o caminho relativo/absoluto do arquivo
    const resolvedPath = path.resolve(args.file);

    console.log(`[Configuração]`);
    console.log(`- Arquivo: ${resolvedPath}`);
    console.log(`- Tipo: ${args.type}`);
    console.log(`- UF: ${args.uf}`);
    console.log(`- Ano: ${args.year}`);
    console.log(`- Turno: ${args.round}`);
    console.log(`- Modo de Análise: ${args.analyze ? 'ATIVADO (Não importará dados)' : 'DESATIVADO (Modo Importação)'}`);

    // Valida se o arquivo existe antes de iniciar
    if (!fs.existsSync(resolvedPath)) {
      console.error(`\n[Erro] Arquivo não encontrado: ${resolvedPath}`);
      process.exit(1);
    }

    // Caso o argumento analyze esteja ativado
    if (args.analyze) {
      console.log('\n[Análise] Iniciando análise de layout do CSV...');
      const report = await analyzeCsvLayout(resolvedPath);
      
      console.log('\n=== RESULTADO DA ANÁLISE DE LAYOUT ===');
      console.log(`- Tamanho do Arquivo: ${report.fileSizeMb.toFixed(2)} MB`);
      console.log(`- Delimitador Detectado: "${report.delimiter}"`);
      console.log(`- Codificação Provável: ${report.probableEncoding}`);
      console.log(`- Total de Colunas Encontradas: ${report.totalColumns}`);
      console.log('\n- Colunas e Amostras de Valores:');
      
      report.columns.forEach((col, idx) => {
        const sampleVals = report.samples[col] || [];
        console.log(`  [${String(idx + 1).padStart(2, '0')}] "${col}" -> Amostras: [${sampleVals.map(v => `"${v}"`).join(', ')}]`);
      });

      const durationSeconds = ((performance.now() - start) / 1000).toFixed(2);
      console.log(`\n- Análise concluída em: ${durationSeconds} segundos.`);
      process.exit(0);
    }

    const stats = fs.statSync(resolvedPath);
    console.log(`- Tamanho do arquivo: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    console.log('\n[Processamento] Analisando delimitador...');
    const delimiter = await detectDelimiter(resolvedPath);
    console.log(`- Delimitador detectado: "${delimiter}"`);

    console.log('\n[Stream] Iniciando leitura do arquivo...');

    const memoryBefore = process.memoryUsage().heapUsed / (1024 * 1024);

    let rowsProcessed = 0;

    await processCsvInStream(resolvedPath, delimiter, (row, lineIndex) => {
      rowsProcessed++;

      // Loga progresso a cada 10.000 linhas
      if (lineIndex % 10000 === 0) {
        const currentMemory = process.memoryUsage().heapUsed / (1024 * 1024);
        console.log(
          `- Linhas processadas: ${lineIndex.toLocaleString('pt-BR')} | Memória Utilizada: ${currentMemory.toFixed(2)} MB`
        );
      }
    });

    const durationSeconds = ((performance.now() - start) / 1000).toFixed(2);
    const memoryAfter = process.memoryUsage().heapUsed / (1024 * 1024);

    console.log('\n=== IMPORTAÇÃO CONCLUÍDA COM SUCESSO ===');
    console.log(`- Total de linhas processadas: ${rowsProcessed.toLocaleString('pt-BR')}`);
    console.log(`- Tempo de execução: ${durationSeconds} segundos`);
    console.log(`- Consumo final de memória: ${memoryAfter.toFixed(2)} MB (Delta: ${(memoryAfter - memoryBefore).toFixed(2)} MB)`);

  } catch (err: any) {
    console.error(`\n[Erro Crítico] Falha na execução do importer: ${err.message}`);
    process.exit(1);
  }
}

main();
