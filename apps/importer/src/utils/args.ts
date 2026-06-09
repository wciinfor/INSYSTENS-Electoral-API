export interface CliArgs {
  file: string;
  type: 'electorate' | 'votes';
  uf: string;
  year: number;
  round: number;
  analyze: boolean;
}

export function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: Partial<CliArgs> = {
    analyze: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file') {
      parsed.file = args[++i];
    } else if (arg === '--type') {
      const typeVal = args[++i];
      if (typeVal !== 'electorate' && typeVal !== 'votes') {
        throw new Error('O argumento --type deve ser "electorate" ou "votes"');
      }
      parsed.type = typeVal;
    } else if (arg === '--uf') {
      parsed.uf = args[++i];
    } else if (arg === '--year') {
      parsed.year = parseInt(args[++i], 10);
    } else if (arg === '--round') {
      parsed.round = parseInt(args[++i], 10);
    } else if (arg === '--analyze') {
      parsed.analyze = true;
    }
  }

  // Validação dos argumentos obrigatórios
  if (!parsed.file) throw new Error('O argumento --file é obrigatório');
  if (!parsed.type) throw new Error('O argumento --type é obrigatório');
  if (!parsed.uf) throw new Error('O argumento --uf é obrigatório');
  if (!parsed.year) throw new Error('O argumento --year é obrigatório');
  if (!parsed.round) throw new Error('O argumento --round é obrigatório');

  return parsed as CliArgs;
}

