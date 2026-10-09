# Architectural Decision Record (ADR) - Universal Reader

## Status
Aprovado

## Contexto
O ecossistema **INSYSTENS** está evoluindo para a **Milestone 2.0 (Data Platform)**. Para processar arquivos de dados massivos de diversas origens (TSE, MandatoPro, demografias externas, etc.), necessitamos de uma camada de ingestão resiliente, performática e altamente extensível. O **Universal Reader** é a primeira etapa dessa pipeline, encarregado puramente de ler arquivos ou streams brutos e produzir um fluxo uniforme de registros.

## Decisões Arquiteturais

### 1. Utilização de `AsyncGenerator` para Ingestão
- **Por quê?** Arquivos do TSE e bases eleitorais podem conter milhões de registros. Carregá-los por completo na memória (`fs.readFileSync` ou arrays em memória) causa estouro de memória (Out-Of-Memory) e gargalos de performance.
- **Solução:** `AsyncGenerator` permite o consumo de dados de forma preguiçosa (lazy evaluation) e sob demanda por streaming, mantendo o consumo de memória extremamente baixo e constante, independente do tamanho do arquivo (baixo Heap footprint).

### 2. Implementação de `Registry Pattern` (Padrão de Registro)
- **Por quê?** Para evitar o uso de estruturas condicionais gigantes (`switch-case` ou `if-else`) acopladas à lógica principal do serviço orquestrador toda vez que adicionamos um novo leitor (ex: XML, Excel, APIs, Bancos).
- **Solução:** O `ReaderRegistry` centraliza os leitores e expõe métodos dinâmicos de descoberta (`find`), onde cada leitor declara de forma agnóstica se é compatível com a fonte informada (`canRead`).

### 3. Responsabilidade Única do Universal Reader
- **Por quê?** Manter o acoplamento baixo. O leitor não deve conhecer regras de normalização de dados, validações cadastrais, chaves de banco de dados ou tipos específicos do TSE.
- **Solução:** O leitor apenas extrai e normaliza o formato do container de dados, retornando sempre o contrato uniforme `IngestionRecord` contendo:
  - `source`: o nome/origem do leitor.
  - `line`: o número da linha original no arquivo de dados.
  - `raw`: o registro bruto (objeto ou string).
  - `metadata`: dados adicionais auxiliares (ex: caminho do arquivo).

---

## Como Adicionar um Novo Leitor (Passo a Passo)

Para expandir a arquitetura da Data Platform adicionando um novo leitor (ex: `XmlReader`):

1. **Criar a classe do Leitor** sob a pasta `src/modules/data-platform/infrastructure/readers/`:
   ```typescript
   import { Reader } from '../../domain/Reader';
   import { IngestionRecord } from '../../domain/IngestionRecord';

   export class XmlReader implements Reader<string, IngestionRecord> {
     canRead(source: string): boolean {
       return source.toLowerCase().endsWith('.xml');
     }

     async *read(source: string): AsyncGenerator<IngestionRecord> {
       // lógica de streaming XML utilizando AsyncGenerator
       // ...
       yield {
         source: 'XmlReader',
         line: currentLine,
         raw: parsedObject,
         metadata: { filePath: source }
       };
     }
   }
   ```

2. **Registrar o novo Leitor** no `ReaderRegistry` durante a inicialização/importação do módulo ou na inicialização do serviço em `application/UniversalReaderService.ts`:
   ```typescript
   ReaderRegistry.register('xml', new XmlReader());
   ```

3. **Pronto!** O `UniversalReaderService` detectará e usará o novo leitor automaticamente nas próximas execuções.
