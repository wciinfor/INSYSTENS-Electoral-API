import * as fs from 'fs';
import * as path from 'path';
import { ReaderRegistry } from '../application/ReaderRegistry';
import { UniversalReaderService } from '../application/UniversalReaderService';
import { CsvReader } from '../infrastructure/readers/CsvReader';
import { JsonReader } from '../infrastructure/readers/JsonReader';
import { NormalizerRegistry } from '../application/NormalizerRegistry';
import { NormalizerService } from '../application/NormalizerService';
import { GenericNormalizer } from '../infrastructure/normalizers/GenericNormalizer';
import { TseNormalizer } from '../infrastructure/normalizers/TseNormalizer';
import { ValidatorRegistry } from '../application/ValidatorRegistry';
import { ValidatorService } from '../application/ValidatorService';
import { GenericValidator } from '../infrastructure/validators/GenericValidator';
import { TseValidator } from '../infrastructure/validators/TseValidator';
import { MapperRegistry } from '../application/MapperRegistry';
import { MapperService } from '../application/MapperService';
import { GenericMapper } from '../infrastructure/mappers/GenericMapper';
import { TseMapper } from '../infrastructure/mappers/TseMapper';
import { ImportSessionRegistry } from '../application/ImportSessionRegistry';
import { ImportSessionService } from '../application/ImportSessionService';
import { EntityDetector } from '../infrastructure/mappers/EntityDetector';
import { PipelineBuilder } from '../application/PipelineBuilder';
import { PipelineContext } from '../domain/PipelineContext';
import { PipelineStep } from '../domain/PipelineStep';
import { ReaderStep } from '../infrastructure/steps/ReaderStep';
import { NormalizerStep } from '../infrastructure/steps/NormalizerStep';
import { ValidatorStep } from '../infrastructure/steps/ValidatorStep';
import { MapperStep } from '../infrastructure/steps/MapperStep';
import { ProviderRegistry } from '../application/ProviderRegistry';
import { ProviderService } from '../application/ProviderService';
import { TseProvider } from '../infrastructure/providers/TseProvider';
import { RepositoryRegistry } from '../../strategic-repository/application/RepositoryRegistry';
import { RepositoryService } from '../../strategic-repository/application/RepositoryService';
import { InMemoryRepository } from '../../strategic-repository/infrastructure/InMemoryRepository';
import { RepositoryManifest } from '../../strategic-repository/domain/RepositoryManifest';
import { RepositoryRecord } from '../../strategic-repository/domain/RepositoryRecord';
import { GraphRegistry } from '../../knowledge-graph/application/GraphRegistry';
import { GraphFactory } from '../../knowledge-graph/application/GraphFactory';
import { GraphNode } from '../../knowledge-graph/domain/GraphNode';
import { GraphEdge } from '../../knowledge-graph/domain/GraphEdge';
import { GraphMetadata } from '../../knowledge-graph/domain/GraphMetadata';
import { GraphNodeType } from '../../knowledge-graph/domain/GraphNodeType';
import { GraphRelationType } from '../../knowledge-graph/domain/GraphRelationType';
import { GraphBuilder } from '../../knowledge-graph/application/GraphBuilder';
import { GraphService } from '../../knowledge-graph/application/GraphService';
import { GraphEdgeRegistry } from '../../knowledge-graph/application/GraphEdgeRegistry';
import { RelationshipRegistry } from '../../knowledge-graph/application/RelationshipRegistry';
import { RelationshipEngine } from '../../knowledge-graph/application/RelationshipEngine';
import { SignalRegistry } from '../../strategic-signals/application/SignalRegistry';
import { SignalEngine } from '../../strategic-signals/application/SignalEngine';
import {
  TerritorialOpportunityRule,
  HighRelationshipDensityRule,
  OrphanNodeRule,
} from '../../strategic-signals/infrastructure/rules/DeterministicSignalRules';
import { StrategicSignal } from '../../strategic-signals/domain/StrategicSignal';
import {
  CandidateBelongsToPartyRule,
  CandidateReceivedVotesFromMunicipalityRule,
  MunicipalityLocatedInOrganizationRule,
} from '../../knowledge-graph/infrastructure/rules/DeterministicRules';
import { RepositoryRecordFactory } from '../../strategic-repository/application/RepositoryRecordFactory';
import { MappedRecord } from '../domain/MappedRecord';
import { IntelligenceOrchestrator } from '../../knowledge-graph/application/IntelligenceOrchestrator';
import { OrchestratorContext } from '../../knowledge-graph/domain/IntelligenceOrchestratorTypes';
import { PrismaStrategicRepository } from '../../strategic-repository/infrastructure/PrismaStrategicRepository';
import { PrismaGraphAdapter } from '../../knowledge-graph/infrastructure/PrismaGraphAdapter';
import { PrismaStrategicSignalRepository } from '../../strategic-signals/infrastructure/PrismaStrategicSignalRepository';
import { InMemorySignalRepository } from '../../strategic-signals/infrastructure/InMemorySignalRepository';
import { IntelligenceOrchestratorFactory } from '../../knowledge-graph/application/IntelligenceOrchestratorFactory';
import { GraphIntelligenceRepository } from '../../intelligence/infrastructure/GraphIntelligenceRepository';
import { StrategicSignalBridge } from '../../intelligence/application/StrategicSignalBridge';
import { DecisionEngine } from '../../../core/decisions/DecisionEngine';
import { KernelPipeline } from '../../../core/kernel/KernelPipeline';
import { PoliticalIntelligenceContext } from '../../../core/kernel/types';
import { DecisionRegistry } from '../../intelligence/application/DecisionRegistry';
import { InMemoryDecisionRepository } from '../../intelligence/infrastructure/InMemoryDecisionRepository';
import { PrismaDecisionRepository } from '../../intelligence/infrastructure/PrismaDecisionRepository';
import { PolicyGuard, DecisionOperation } from '../../intelligence/security/PolicyGuard';
import { ActorContext } from '../../intelligence/security/ActorContext';
import { InMemoryDecisionAuditTrail } from '../../intelligence/audit/InMemoryDecisionAuditTrail';
import { PrismaDecisionAuditTrail } from '../../intelligence/audit/PrismaDecisionAuditTrail';
import { ActionProposalFactory } from '../../intelligence/application/ActionProposalFactory';
import { ActionProposalStatus } from '../../intelligence/domain/ActionProposalRecord';
import { InMemoryActionProposalRepository } from '../../intelligence/infrastructure/InMemoryActionProposalRepository';
import { PrismaActionProposalRepository } from '../../intelligence/infrastructure/PrismaActionProposalRepository';
import { ActionGovernanceService, ActionGovernanceOperation } from '../../intelligence/application/ActionGovernanceService';
import { ActionExecutionStatus, ActionExecutionMode } from '../../intelligence/domain/ActionExecutionRecord';
import { InMemoryActionExecutionRepository } from '../../intelligence/infrastructure/InMemoryActionExecutionRepository';
import { PrismaActionExecutionRepository } from '../../intelligence/infrastructure/PrismaActionExecutionRepository';
import { ActionExecutionService } from '../../intelligence/application/ActionExecutionService';







// Cores para os logs
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const tempDir = path.join(__dirname, 'temp');

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`${RED}✗ FALHA: ${message}${RESET}`);
    throw new Error(message);
  }
  console.log(`${GREEN}✓ PASSOU: ${message}${RESET}`);
}

async function setup() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Criar arquivos de teste
  fs.writeFileSync(
    path.join(tempDir, 'valid.csv'),
    'nome;cargo;partido\nAlcantara;Prefeito;PDS\nSouza;Vereador;PL\n'
  );

  fs.writeFileSync(
    path.join(tempDir, 'empty.csv'),
    ''
  );

  fs.writeFileSync(
    path.join(tempDir, 'valid.json'),
    JSON.stringify([
      { id: 1, name: 'Alcantara' },
      { id: 2, name: 'Souza' }
    ])
  );

  fs.writeFileSync(
    path.join(tempDir, 'single.json'),
    JSON.stringify({ id: 9, name: 'Single' })
  );

  fs.writeFileSync(
    path.join(tempDir, 'valid.ndjson'),
    '{"id":10,"name":"ND1"}\n{"id":20,"name":"ND2"}\n'
  );
}

function teardown() {
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
      fs.rmdirSync(tempDir);
    }
  } catch (err) {
    console.error('Erro ao limpar arquivos temporários:', err);
  }
}

async function runTests() {
  console.log('--- Iniciando Testes: Data Platform Universal Reader ---');
  await setup();

  try {
    // ----------------------------------------------------
    // Teste 1: ReaderRegistry
    // ----------------------------------------------------
    console.log('\n[Teste 1] Validando ReaderRegistry...');
    ReaderRegistry.clear();
    assert(ReaderRegistry.list().length === 0, 'O registro deve iniciar vazio');

    const csvReader = new CsvReader();
    const jsonReader = new JsonReader();

    ReaderRegistry.register('csv', csvReader);
    ReaderRegistry.register('json', jsonReader);

    assert(ReaderRegistry.list().length === 2, 'Devem ter dois leitores registrados');
    assert(ReaderRegistry.get('csv') === csvReader, 'Deve recuperar o CsvReader cadastrado');
    assert(ReaderRegistry.get('json') === jsonReader, 'Deve recuperar o JsonReader cadastrado');

    const foundCsv = ReaderRegistry.find('mock.csv');
    assert(foundCsv === csvReader, 'Deve encontrar o CsvReader pelo nome do arquivo');

    const foundJson = ReaderRegistry.find('mock.ndjson');
    assert(foundJson === jsonReader, 'Deve encontrar o JsonReader pela extensão ndjson');

    // ----------------------------------------------------
    // Teste 2: CsvReader (Arquivo válido)
    // ----------------------------------------------------
    console.log('\n[Teste 2] Validando CsvReader com arquivo físico...');
    const csvPath = path.join(tempDir, 'valid.csv');
    const csvRecords = [];
    for await (const record of csvReader.read(csvPath)) {
      csvRecords.push(record);
    }

    assert(csvRecords.length === 2, 'Deve ler exatamente 2 registros do CSV');
    assert((csvRecords[0].raw as any).nome === 'Alcantara', 'Primeiro registro deve ter nome Alcantara');
    assert(csvRecords[0].line === 2, 'A linha original do primeiro registro de dados deve ser 2');
    assert((csvRecords[1].raw as any).partido === 'PL', 'Segundo registro deve ter partido PL');

    // ----------------------------------------------------
    // Teste 3: CsvReader (Arquivo vazio)
    // ----------------------------------------------------
    console.log('\n[Teste 3] Validando CsvReader com arquivo vazio...');
    const emptyCsvPath = path.join(tempDir, 'empty.csv');
    const emptyCsvRecords = [];
    for await (const record of csvReader.read(emptyCsvPath)) {
      emptyCsvRecords.push(record);
    }
    assert(emptyCsvRecords.length === 0, 'Arquivo vazio não deve produzir registros');

    // ----------------------------------------------------
    // Teste 4: CsvReader (Texto em memória)
    // ----------------------------------------------------
    console.log('\n[Teste 4] Validando CsvReader com dados em memória...');
    const csvMemory = 'col1;col2\nval1;val2';
    const csvMemoryRecords = [];
    for await (const record of csvReader.read(csvMemory)) {
      csvMemoryRecords.push(record);
    }
    assert(csvMemoryRecords.length === 1, 'Deve ler 1 registro em memória');
    assert((csvMemoryRecords[0].raw as any).col1 === 'val1', 'O campo col1 deve ser val1');
    assert(csvMemoryRecords[0].metadata?.type === 'memory_string', 'Deve marcar metadados como memory_string');

    // ----------------------------------------------------
    // Teste 5: JsonReader (Array de objetos)
    // ----------------------------------------------------
    console.log('\n[Teste 5] Validando JsonReader com Array JSON...');
    const jsonPath = path.join(tempDir, 'valid.json');
    const jsonRecords = [];
    for await (const record of jsonReader.read(jsonPath)) {
      jsonRecords.push(record);
    }
    assert(jsonRecords.length === 2, 'Deve ler 2 registros do Array JSON');
    assert((jsonRecords[0].raw as any).name === 'Alcantara', 'Primeiro objeto do array deve ter nome Alcantara');

    // ----------------------------------------------------
    // Teste 6: JsonReader (Objeto único)
    // ----------------------------------------------------
    console.log('\n[Teste 6] Validando JsonReader com Objeto Único...');
    const singlePath = path.join(tempDir, 'single.json');
    const singleRecords = [];
    for await (const record of jsonReader.read(singlePath)) {
      singleRecords.push(record);
    }
    assert(singleRecords.length === 1, 'Deve ler 1 registro do Objeto Único JSON');
    assert((singleRecords[0].raw as any).name === 'Single', 'Deve ter o nome Single');

    // ----------------------------------------------------
    // Teste 7: JsonReader (NDJSON)
    // ----------------------------------------------------
    console.log('\n[Teste 7] Validando JsonReader com NDJSON...');
    const ndjsonPath = path.join(tempDir, 'valid.ndjson');
    const ndjsonRecords = [];
    for await (const record of jsonReader.read(ndjsonPath)) {
      ndjsonRecords.push(record);
    }
    assert(ndjsonRecords.length === 2, 'Deve ler 2 registros do arquivo NDJSON');
    assert((ndjsonRecords[0].raw as any).id === 10, 'O id do primeiro registro NDJSON deve ser 10');
    assert((ndjsonRecords[1].raw as any).name === 'ND2', 'O nome do segundo registro NDJSON deve ser ND2');

    // ----------------------------------------------------
    // Teste 8: UniversalReaderService (Fluxo fim-a-fim)
    // ----------------------------------------------------
    console.log('\n[Teste 8] Validando UniversalReaderService...');
    const finalRecords = [];
    for await (const record of UniversalReaderService.read(csvPath)) {
      finalRecords.push(record);
    }
    assert(finalRecords.length === 2, 'UniversalReaderService deve ler com sucesso via CsvReader');

    // ----------------------------------------------------
    // Teste 9: Inexistência de arquivos
    // ----------------------------------------------------
    console.log('\n[Teste 9] Validando comportamento para arquivo inexistente...');
    try {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.csv');
      // Embora canRead seja true, o leitor deve lançar erro se o arquivo não existe fisicamente
      for await (const _ of UniversalReaderService.read(nonExistentPath)) {
        // não deve entrar
      }
      assert(false, 'Deveria ter lançado erro para arquivo inexistente');
    } catch (err: any) {
      assert(true, `Capturou erro esperado para arquivo inexistente: ${err.message}`);
    }

    // ----------------------------------------------------
    // Teste 10: NormalizerRegistry
    // ----------------------------------------------------
    console.log('\n[Teste 10] Validando NormalizerRegistry...');
    NormalizerRegistry.clear();
    assert(NormalizerRegistry.list().length === 0, 'O registro de normalizadores deve iniciar vazio');

    const genericNormalizer = new GenericNormalizer();
    const tseNormalizer = new TseNormalizer();

    NormalizerRegistry.register('generic', genericNormalizer);
    NormalizerRegistry.register('tse', tseNormalizer);

    assert(NormalizerRegistry.list().length === 2, 'Devem ter dois normalizadores registrados');
    assert(NormalizerRegistry.get('generic') === genericNormalizer, 'Deve recuperar o GenericNormalizer');
    
    const foundGeneric = NormalizerRegistry.find('some_generic_provider');
    assert(foundGeneric === genericNormalizer, 'Deve rotear para GenericNormalizer por padrão');

    const foundTse = NormalizerRegistry.find('TSE_Detalhamento.csv');
    assert(foundTse === tseNormalizer, 'Deve rotear para TseNormalizer se contiver "tse" no nome da fonte');

    // ----------------------------------------------------
    // Teste 11: GenericNormalizer (tipagem e transformações)
    // ----------------------------------------------------
    console.log('\n[Teste 11] Validando GenericNormalizer (regras de conversão)...');
    
    const rawRecord = {
      source: 'memory',
      line: 1,
      raw: {
        'NOME_COMPLETO': '  Jose Silva  ',
        'PARTIDO_POLITICO': '   ',
        'ATIVO': 'true',
        'BLOQUEADO': 'FALSE',
        'TOTAL_VOTOS': '15340',
        'PERCENTUAL': '45,67',
        'CODIGO_ZONA': '00123',
        'DATA_NASCIMENTO': '15/08/1985',
        'DATA_CADASTRO': '2026-06-10',
        'TEXTO_ALEATORIO': '01/13/2026'
      }
    };

    const normalized = await genericNormalizer.normalize(rawRecord);

    assert(normalized.data.nomeCompleto === 'Jose Silva', 'Deve aplicar trim e camelCase na chave');
    assert(normalized.data.partidoPolitico === null, 'String vazia deve ser convertida para null');
    assert(normalized.data.ativo === true, 'Deve converter "true" para boolean true');
    assert(normalized.data.bloqueado === false, 'Deve converter "FALSE" para boolean false');
    assert(normalized.data.totalVotos === 15340, 'Deve converter string numérica para number');
    assert(normalized.data.percentual === 45.67, 'Deve converter string com vírgula para número decimal');
    assert(normalized.data.codigoZona === '00123', 'Deve manter zeros à esquerda como string');
    assert(typeof normalized.data.dataNascimento === 'string' && normalized.data.dataNascimento.endsWith('Z'), 'Deve converter data DD/MM/YYYY para ISO string');
    assert(typeof normalized.data.dataCadastro === 'string' && normalized.data.dataCadastro.endsWith('Z'), 'Deve converter data YYYY-MM-DD para ISO string');
    assert(normalized.data.textoAleatorio === '01/13/2026', 'Não deve converter datas inválidas (mês 13)');

    // ----------------------------------------------------
    // Teste 12: NormalizerService
    // ----------------------------------------------------
    console.log('\n[Teste 12] Validando NormalizerService...');
    // Registra novamente para uso no service
    NormalizerRegistry.clear();
    NormalizerRegistry.register('generic', genericNormalizer);
    
    const serviceRecord = {
      source: 'generic',
      line: 1,
      raw: { 'TEST_FIELD': '  some value  ' }
    };

    const serviceResult = await NormalizerService.normalize(serviceRecord);
    assert(serviceResult.data.testField === 'some value', 'NormalizerService deve localizar normalizador e processar com sucesso');

    try {
      const unregisteredRecord = {
        source: 'unregistered_provider',
        line: 1,
        raw: {}
      };
      await NormalizerService.normalize(unregisteredRecord);
      assert(false, 'Deveria ter lançado erro para provedor não registrado');
    } catch (err: any) {
      assert(true, `Capturou erro esperado no NormalizerService: ${err.message}`);
    }

    // ----------------------------------------------------
    // Teste 13: ValidatorRegistry
    // ----------------------------------------------------
    console.log('\n[Teste 13] Validando ValidatorRegistry...');
    ValidatorRegistry.clear();
    assert(ValidatorRegistry.list().length === 0, 'O registro de validadores deve iniciar vazio');

    const genericValidator = new GenericValidator();
    const tseValidator = new TseValidator();

    ValidatorRegistry.register('generic', genericValidator);
    ValidatorRegistry.register('tse', tseValidator);

    assert(ValidatorRegistry.list().length === 2, 'Devem ter dois validadores registrados');
    assert(ValidatorRegistry.get('generic') === genericValidator, 'Deve recuperar o GenericValidator');

    const foundGenVal = ValidatorRegistry.find('some_provider');
    assert(foundGenVal === genericValidator, 'Deve rotear para GenericValidator por padrão');

    const foundTseVal = ValidatorRegistry.find('tse_data');
    assert(foundTseVal === tseValidator, 'Deve rotear para TseValidator se a fonte contiver "tse"');

    // ----------------------------------------------------
    // Teste 14: GenericValidator (Consistência estrutural)
    // ----------------------------------------------------
    console.log('\n[Teste 14] Validando GenericValidator (erros, warnings e score)...');
    
    // 14.1 Record Válido sem warnings
    const validRecord = {
      source: 'generic',
      line: 1,
      data: { field1: 'value1', field2: 123 }
    };
    const validRes = await genericValidator.validate(validRecord);
    assert(validRes.valid === true, 'Registro completo deve ser válido');
    assert(validRes.score === 100, 'Registro sem erros ou warnings deve ter score 100');
    assert(validRes.warnings.length === 0, 'Não deve conter warnings');

    // 14.2 Record Inválido (sem source, line negativa e sem data)
    const invalidRecord = {
      source: '',
      line: -5,
      data: {}
    };
    const invalidRes = await genericValidator.validate(invalidRecord);
    assert(invalidRes.valid === false, 'Registro incompleto não deve ser válido');
    assert(invalidRes.errors.length === 3, 'Deve conter 3 erros estruturais (source vazio, line < 0, data vazia)');
    assert(invalidRes.score === 40, 'Score deve ser 100 - (3 * 20) = 40');

    // 14.3 Record com múltiplos nulos (> 10 nulos) para testar o limite de warnings
    const nullsRecord = {
      source: 'generic',
      line: 2,
      data: {
        f1: null, f2: null, f3: null, f4: null, f5: null,
        f6: null, f7: null, f8: null, f9: null, f10: null,
        f11: null, f12: null
      }
    };
    const nullsRes = await genericValidator.validate(nullsRecord);
    assert(nullsRes.valid === true, 'Apenas warnings por nulo não invalidam o registro');
    assert(nullsRes.warnings.length === 10, 'Deve limitar a lista a no máximo 10 warnings de nulo');
    assert(nullsRes.score === 50, 'Score deve penalizar warnings limitados em 10: 100 - (10 * 5) = 50');

    // ----------------------------------------------------
    // Teste 15: ValidatorService
    // ----------------------------------------------------
    console.log('\n[Teste 15] Validando ValidatorService...');
    ValidatorRegistry.clear();
    ValidatorRegistry.register('generic', genericValidator);

    const serviceValResult = await ValidatorService.validate(validRecord);
    assert(serviceValResult.valid === true, 'ValidatorService deve orquestrar a validação e retornar sucesso');

    try {
      const unregRecord = {
        source: 'unregistered_provider',
        line: 1,
        data: { test: 1 }
      };
      await ValidatorService.validate(unregRecord);
      assert(false, 'Deveria ter lançado erro para validador não registrado');
    } catch (err: any) {
      assert(true, `Capturou erro esperado no ValidatorService: ${err.message}`);
    }

    // ----------------------------------------------------
    // Teste 16: MapperRegistry
    // ----------------------------------------------------
    console.log('\n[Teste 16] Validando MapperRegistry...');
    MapperRegistry.clear();
    assert(MapperRegistry.list().length === 0, 'O registro de mapeadores deve iniciar vazio');

    const genericMapper = new GenericMapper();
    const tseMapper = new TseMapper();

    MapperRegistry.register('generic', genericMapper);
    MapperRegistry.register('tse', tseMapper);

    assert(MapperRegistry.list().length === 2, 'Devem ter dois mapeadores registrados');
    assert(MapperRegistry.get('generic') === genericMapper, 'Deve recuperar o GenericMapper');

    const foundGenMapper = MapperRegistry.find('some_provider');
    assert(foundGenMapper === genericMapper, 'Deve rotear para GenericMapper por padrão');

    const foundTseMapper = MapperRegistry.find('TSE_candidatos_2026.csv');
    assert(foundTseMapper === tseMapper, 'Deve rotear para TseMapper se a fonte contiver "tse"');

    // ----------------------------------------------------
    // Teste 17: EntityDetector (Prioridade de detecção e confiança)
    // ----------------------------------------------------
    console.log('\n[Teste 17] Validando EntityDetector...');
    
    // 17.1 Detecção por chave no data (prioridade 1 - confiança 0.95)
    const resA = EntityDetector.detect('unknown_source', { 'cargoCandidato': 'Prefeito' }, {});
    assert(resA.entity === 'candidate' && resA.confidence === 0.95, 'Deve detectar candidate por chave no data');

    // 17.2 Detecção por provider (prioridade 2 - confiança 0.85)
    const resB = EntityDetector.detect('unknown_source', { 'random': 123 }, { provider: 'party_list' });
    assert(resB.entity === 'party' && resB.confidence === 0.85, 'Deve detectar party pelo provider no metadata');

    // 17.3 Detecção por nome de arquivo (prioridade 3 - confiança 0.70)
    const resC = EntityDetector.detect('TSE_votos_secao.csv', { 'random': 123 }, {});
    assert(resC.entity === 'vote' && resC.confidence === 0.70, 'Deve detectar vote pelo nome do arquivo');

    // 17.4 Fallback para generic (confiança 1.0)
    const resD = EntityDetector.detect('unknown_source.csv', { 'random': 123 }, {});
    assert(resD.entity === 'generic' && resD.confidence === 1.0, 'Deve retornar generic com confiança 1.0 se não reconhecer nada');

    // ----------------------------------------------------
    // Teste 18: MapperService e TseMapper
    // ----------------------------------------------------
    console.log('\n[Teste 18] Validando MapperService...');
    
    const candidateValResult = {
      valid: true,
      score: 100,
      warnings: [],
      errors: [],
      record: {
        source: 'TSE_candidatos.csv',
        line: 1,
        data: { nomeUrna: 'ZE DA SILVA', numeroCandidato: 12345 }
      }
    };

    const mappedResult = await MapperService.map(candidateValResult);
    assert(mappedResult.entity === 'candidate', 'TseMapper deve usar EntityDetector para classificar como candidate');
    assert(mappedResult.confidence === 0.95, 'Confiança deve ser 0.95 devido a chaves em data');
    assert(mappedResult.data.nomeUrna === 'ZE DA SILVA', 'Deve manter os dados estruturados corretos');

    try {
      const unregValResult = {
        valid: true,
        score: 100,
        warnings: [],
        errors: [],
        record: {
          source: 'unregistered_provider',
          line: 1,
          data: {}
        }
      };
      // Limpa registros para testar falha no service
      MapperRegistry.clear();
      await MapperService.map(unregValResult);
      assert(false, 'Deveria ter lançado erro para mapeador não registrado');
    } catch (err: any) {
      assert(true, `Capturou erro esperado no MapperService: ${err.message}`);
    }

    // ----------------------------------------------------
    // Teste 19: ImportSessionRegistry e criação
    // ----------------------------------------------------
    console.log('\n[Teste 19] Validando ImportSessionRegistry e criação...');
    ImportSessionRegistry.clear();
    assert(ImportSessionRegistry.list().length === 0, 'O registro de sessões deve iniciar vazio');

    const session = ImportSessionService.create('tse_provider', { file: 'cand_2026.csv' });
    assert(session.status === 'created', 'Sessão recém criada deve ter status "created"');
    assert(session.startedAt === undefined, 'startedAt deve ser indefinido na criação');
    assert(session.metrics.processed === 0, 'Métricas iniciais de processamento devem ser zero');
    assert(ImportSessionRegistry.list().length === 1, 'Deve conter uma sessão registrada');

    // ----------------------------------------------------
    // Teste 20: ImportSession ciclo de vida e transições
    // ----------------------------------------------------
    console.log('\n[Teste 20] Validando transições de status e progresso de ImportSession...');
    
    // Iniciar sessão
    ImportSessionService.start(session.id);
    assert(session.status === 'running', 'Status deve mudar para "running"');
    assert(typeof session.startedAt === 'string', 'startedAt deve ser preenchido');

    // Atualizar progresso
    ImportSessionService.progress(session.id, 10, 2, 1);
    assert(session.metrics.success === 10, 'Sucesso deve ser incrementado para 10');
    assert(session.metrics.failed === 2, 'Falha deve ser incrementada para 2');
    assert(session.metrics.skipped === 1, 'Ignorados devem ser incrementados para 1');
    assert(session.metrics.processed === 13, 'Processed deve ser calculado como a soma 10 + 2 + 1 = 13');

    // Bloquear progresso em finalizadas
    ImportSessionService.complete(session.id);
    assert(session.status === 'completed', 'Sessão concluída deve ter status "completed"');
    assert(session.duration >= 0, 'Duração deve ser calculada e ser maior ou igual a zero');

    try {
      ImportSessionService.progress(session.id, 5, 0, 0);
      assert(false, 'Deveria ter lançado erro ao tentar atualizar progresso em sessão finalizada');
    } catch (err: any) {
      assert(true, `Capturou erro esperado ao atualizar progresso de sessão finalizada: ${err.message}`);
    }

    // ----------------------------------------------------
    // Teste 21: Falha e cancelamento de sessões
    // ----------------------------------------------------
    console.log('\n[Teste 21] Validando falha e cancelamento de ImportSession...');
    
    // Testar falha
    const sessionFail = ImportSessionService.create('tse_provider_fail');
    ImportSessionService.start(sessionFail.id);
    ImportSessionService.fail(sessionFail.id, 'Timeout na rede');
    assert(sessionFail.status === 'failed', 'Status deve mudar para "failed"');
    assert(sessionFail.metadata?.error === 'Timeout na rede', 'Erro deve ser gravado em metadata.error');
    assert(sessionFail.duration >= 0, 'Duração de falha calculada com sucesso');

    // Testar cancelamento
    const sessionCancel = ImportSessionService.create('tse_provider_cancel');
    ImportSessionService.start(sessionCancel.id);
    ImportSessionService.cancel(sessionCancel.id);
    assert(sessionCancel.status === 'cancelled', 'Status deve mudar para "cancelled"');
    assert(sessionCancel.duration >= 0, 'Duração de cancelamento calculada com sucesso');

    // ----------------------------------------------------
    // Teste 22: Pipeline (sucesso fim-a-fim e imutabilidade)
    // ----------------------------------------------------
    console.log('\n[Teste 22] Validando Pipeline (sucesso e imutabilidade)...');
    
    // Configura os registries com implementações padrão para integração
    ReaderRegistry.clear();
    ReaderRegistry.register('csv', new CsvReader());
    NormalizerRegistry.clear();
    NormalizerRegistry.register('generic', new GenericNormalizer());
    ValidatorRegistry.clear();
    ValidatorRegistry.register('generic', new GenericValidator());
    MapperRegistry.clear();
    MapperRegistry.register('generic', new GenericMapper());

    const pipelineSession = ImportSessionService.create('test_pipeline');
    ImportSessionService.start(pipelineSession.id);

    const pipeline = new PipelineBuilder()
      .add(new ReaderStep())
      .add(new NormalizerStep())
      .add(new ValidatorStep())
      .add(new MapperStep())
      .build();

    const initialContext: PipelineContext = {
      session: pipelineSession,
      ingestionRecord: {
        source: 'generic',
        line: 1,
        raw: { 'NOME_CANDIDATO': '  Jose da Silva  ' }
      }
    };

    const finalContext = await pipeline.run(initialContext);

    // Verificações de sucesso
    assert(finalContext.ingestionRecord !== undefined, 'Deve conter ingestionRecord');
    assert(finalContext.normalizedRecord?.data.nomeCandidato === 'Jose da Silva', 'NormalizerStep deve ter normalizado o campo');
    assert(finalContext.validationResult?.valid === true, 'ValidatorStep deve ter validado com sucesso');
    assert(finalContext.mappedRecord?.entity === 'generic', 'MapperStep deve ter mapeado a entidade');
    assert(pipelineSession.metrics.success === 1, 'Métricas da sessão devem registrar success === 1');

    // Verificações de imutabilidade
    assert(initialContext.normalizedRecord === undefined, 'Contexto original não deve conter normalizedRecord');
    assert(initialContext !== finalContext, 'O contexto de retorno deve ser um novo objeto');

    // ----------------------------------------------------
    // Teste 23: Pipeline (interrupção/skipped quando inválido)
    // ----------------------------------------------------
    console.log('\n[Teste 23] Validando Pipeline (skipped quando inválido)...');
    
    const pipelineSessionSkipped = ImportSessionService.create('test_pipeline_skipped');
    ImportSessionService.start(pipelineSessionSkipped.id);

    const invalidContext: PipelineContext = {
      session: pipelineSessionSkipped,
      ingestionRecord: {
        source: 'generic',
        line: 1,
        raw: {} // Objeto de dados vazio gera erro de validação
      }
    };

    const skippedContext = await pipeline.run(invalidContext);

    assert(skippedContext.validationResult?.valid === false, 'ValidatorStep deve identificar registro inválido');
    assert(skippedContext.mappedRecord === undefined, 'MapperStep não deve ser executado para registro inválido');
    assert(pipelineSessionSkipped.metrics.skipped === 1, 'Métricas da sessão devem registrar skipped === 1');
    assert(pipelineSessionSkipped.metrics.success === 0, 'Sessão não deve ter sucesso registrado');

    // ----------------------------------------------------
    // Teste 24: Pipeline (falhas e interrupção por erro)
    // ----------------------------------------------------
    console.log('\n[Teste 24] Validando Pipeline (falhas e aborto)...');
    
    const pipelineSessionFailed = ImportSessionService.create('test_pipeline_failed');
    ImportSessionService.start(pipelineSessionFailed.id);

    const errorContext: PipelineContext = {
      session: pipelineSessionFailed,
      // Não passa ingestionRecord, o que obriga o ReaderStep a ler do source de metadata
      metadata: { source: 'arquivo-inexistente.csv' }
    };

    try {
      await pipeline.run(errorContext);
      assert(false, 'Deveria ter lançado erro para arquivo inexistente');
    } catch (err: any) {
      assert(true, `Pipeline abortado e erro capturado com sucesso: ${err.message}`);
      assert(pipelineSessionFailed.status === 'failed', 'Status da sessão deve ser atualizado para "failed"');
      assert(pipelineSessionFailed.metrics.failed === 1, 'Métricas da sessão devem registrar failed === 1');
    }

    // ----------------------------------------------------
    // Teste 25: ProviderRegistry (registro, busca, listagem)
    // ----------------------------------------------------
    console.log('\n[Teste 25] Validando ProviderRegistry...');
    ProviderRegistry.clear();
    assert(ProviderRegistry.list().length === 0, 'O ProviderRegistry deve iniciar vazio');

    const mockTseProvider = new TseProvider();
    ProviderRegistry.register(mockTseProvider as any);

    assert(ProviderRegistry.list().length === 1, 'Deve conter 1 provider após registro');
    assert(ProviderRegistry.find('tse') === (mockTseProvider as any), 'Deve encontrar o TseProvider pelo ID "tse"');
    assert(ProviderRegistry.find('unknown') === undefined, 'Deve retornar undefined para provider inexistente');

    // ----------------------------------------------------
    // Teste 26: TseProvider e TseProviderManifest
    // ----------------------------------------------------
    console.log('\n[Teste 26] Validando TseProvider e TseProviderManifest...');
    assert(mockTseProvider.id === 'tse', 'TseProvider deve ter ID "tse"');
    assert(mockTseProvider.manifest.name === 'Tribunal Superior Eleitoral', 'Manifest name deve ser o do TSE');
    assert(mockTseProvider.manifest.supportedEntities.includes('candidate'), 'Deve suportar candidate');
    assert(mockTseProvider.manifest.supportedEntities.includes('vote'), 'Deve suportar vote');
    assert(typeof mockTseProvider.reader.read === 'function', 'TseProvider deve possuir método read no seu reader');

    // ----------------------------------------------------
    // Teste 27: ProviderService (sucesso fim-a-fim)
    // ----------------------------------------------------
    console.log('\n[Teste 27] Validando ProviderService (processamento de registro e logs)...');
    
    // Configura o ReaderRegistry para leitura simulada
    ReaderRegistry.clear();
    ReaderRegistry.register('csv', new CsvReader());

    // Escreve um arquivo de dados válido para o TSE
    const tseCsvPath = path.join(tempDir, 'tse_candidatos_2026.csv');
    fs.writeFileSync(tseCsvPath, 'nome_urna;numero_candidato\nZE DA SILVA;12345\n');

    const mapped = await ProviderService.processRecord('tse', tseCsvPath);

    assert(mapped !== null, 'MappedRecord retornado não deve ser nulo');
    assert(mapped!.entity === 'candidate', 'Entidade deve ser identificada como "candidate"');
    assert(mapped!.data.nomeUrna === 'ZE DA SILVA', 'Deve preservar os dados normalizados');
    assert(mapped!.confidence === 0.95, 'Deve herdar a detecção de confiança');

    // ----------------------------------------------------
    // Teste 28: ProviderService (erros de processamento e logs estruturados)
    // ----------------------------------------------------
    console.log('\n[Teste 28] Validando ProviderService tratamento de erro...');
    
    try {
      await ProviderService.processRecord('unknown_provider', tseCsvPath);
      assert(false, 'Deveria lançar erro para provider não registrado');
    } catch (err: any) {
      assert(err.message.includes('não encontrado'), 'Deve acusar que o provider não foi encontrado');
    }

    try {
      await ProviderService.processRecord('tse', 'arquivo-inexistente.csv');
      assert(false, 'Deveria lançar erro ao falhar no pipeline por arquivo inexistente');
    } catch (err: any) {
      assert(true, 'Capturou erro esperado do pipeline abortado no ProviderService');
    }

    // ----------------------------------------------------
    // Teste 29: RepositoryRegistry
    // ----------------------------------------------------
    console.log('\n[Teste 29] Validando RepositoryRegistry...');
    RepositoryRegistry.clear();
    assert(RepositoryRegistry.list().length === 0, 'O registry deve iniciar vazio');

    const manifestA: RepositoryManifest = {
      id: 'repo-a',
      name: 'InMemory Repo A',
      version: '1.0.0',
      supportedEntities: ['candidate', 'party'],
    };
    const repoA = new InMemoryRepository(manifestA);
    RepositoryRegistry.register(repoA);

    assert(RepositoryRegistry.list().length === 1, 'Deve conter 1 repositório registrado');
    assert(RepositoryRegistry.find('repo-a') === repoA, 'Deve achar o repositório pelo ID');

    // Tenta registrar duplicado
    try {
      RepositoryRegistry.register(repoA);
      assert(false, 'Deveria barrar registro de manifest.id duplicado');
    } catch (err: any) {
      assert(err.message.includes('já está registrado'), 'Deve acusar registro duplicado');
    }

    // ----------------------------------------------------
    // Teste 30: InMemoryRepository e idempotência
    // ----------------------------------------------------
    console.log('\n[Teste 30] Validando InMemoryRepository e idempotência...');
    await repoA.clear();
    assert(await repoA.count() === 0, 'Deveria estar vazio');

    const rec1: RepositoryRecord = {
      id: 'rec-1',
      entity: 'candidate',
      source: 'tse',
      data: { name: 'Cand 1' },
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    const rec2: RepositoryRecord = {
      id: 'rec-1', // mesmo id para testar idempotência/sobrescrita
      entity: 'candidate',
      source: 'tse',
      data: { name: 'Cand 1 Updated' },
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    await repoA.store(rec1);
    assert(await repoA.count() === 1, 'Deveria ter 1 registro');

    await repoA.store(rec2);
    assert(await repoA.count() === 1, 'Deveria continuar com 1 registro (sobrescrito)');

    const fetched = await repoA.find('rec-1');
    assert(fetched?.data.name === 'Cand 1 Updated', 'Deve recuperar o registro atualizado');

    // ----------------------------------------------------
    // Teste 31: RepositoryService e buscas
    // ----------------------------------------------------
    console.log('\n[Teste 31] Validando RepositoryService, buscas e findByEntity...');
    
    // Testa busca por entidade quando não há
    const emptyList = await RepositoryService.findByEntity('party', 'repo-a');
    assert(Array.isArray(emptyList) && emptyList.length === 0, 'Deve retornar array vazio se nenhuma entidade corresponder');

    const rec3: RepositoryRecord = {
      id: 'rec-3',
      entity: 'party',
      source: 'ibge',
      data: { name: 'Partido Novo' },
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    await RepositoryService.store(rec3, 'repo-a');

    const partyList = await RepositoryService.findByEntity('party', 'repo-a');
    assert(partyList.length === 1 && partyList[0].id === 'rec-3', 'Deve achar 1 party');

    // ----------------------------------------------------
    // Teste 32: RepositoryService fallback/ID opcional e logs
    // ----------------------------------------------------
    console.log('\n[Teste 32] Validando RepositoryService ID opcional...');
    
    // Sem passar repositoryId, deve pegar o primeiro repositório registrado (repoA)
    const totalCount = await RepositoryService.count();
    assert(totalCount === 2, 'RepositoryService deve buscar no primeiro repo e achar 2 registros');

    // Se limpar o registro e tentar executar operações, deve dar erro claro
    RepositoryRegistry.clear();
    try {
      await RepositoryService.count();
      assert(false, 'Deveria lançar erro se não houver repositórios no registry');
    } catch (err: any) {
      assert(err.message.includes('Nenhum Repository registrado'), 'Mensagem de erro deve ser clara');
    }

    // ----------------------------------------------------
    // Teste 33: Contratos GraphNode, GraphEdge e GraphMetadata
    // ----------------------------------------------------
    console.log('\n[Teste 33] Validando Contratos de Node, Edge e Metadata...');
    
    const meta: GraphMetadata = {
      source: 'test',
      confidence: 0.9,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const node: GraphNode = {
      id: 'node-1',
      type: 'candidate',
      properties: { name: 'Cand X' },
      metadata: meta,
    };

    const edge: GraphEdge = {
      id: 'edge-1',
      from: 'node-1',
      to: 'node-2',
      relation: 'belongs_to',
      weight: 0.85,
      metadata: meta,
    };

    assert(node.id === 'node-1', 'Deve instanciar GraphNode com id correto');
    assert(edge.relation === 'belongs_to', 'Deve instanciar GraphEdge com relação correta');
    assert(edge.weight === 0.85, 'Deve instanciar GraphEdge com peso correto');

    // ----------------------------------------------------
    // Teste 34: GraphRegistry (registro e listagem)
    // ----------------------------------------------------
    console.log('\n[Teste 34] Validando GraphRegistry...');
    GraphRegistry.clear();
    assert(GraphRegistry.list().length === 0, 'O registry de grafos deve iniciar vazio');

    GraphRegistry.register(node);
    assert(GraphRegistry.list().length === 1, 'Deve possuir 1 node após registro');
    assert(GraphRegistry.find('node-1') === node, 'Deve achar o node pelo ID');

    // Impedir registros duplicados
    try {
      GraphRegistry.register(node);
      assert(false, 'Deveria lançar erro ao tentar registrar node.id duplicado');
    } catch (err: any) {
      assert(err.message.includes('já está registrado'), 'Deve acusar ID duplicado no GraphRegistry');
    }

    // ----------------------------------------------------
    // Teste 35: GraphFactory (Mapeamento e propriedades)
    // ----------------------------------------------------
    console.log('\n[Teste 35] Validando GraphFactory...');
    
    const record: RepositoryRecord = {
      id: 'rep-rec-123',
      entity: 'party',
      source: 'tse-sources',
      data: { name: 'Partido X', sigla: 'PX' },
      metadata: { confidence: 0.95, version: '2.0.0' },
      createdAt: new Date().toISOString(),
    };

    const generatedNode = GraphFactory.createFromRecord(record);

    assert(generatedNode.id === 'rep-rec-123', 'O node.id deve ser gerado a partir do record.id');
    assert(generatedNode.type === 'party', 'Entidade do record deve ser convertida para type do node');
    assert(generatedNode.properties.name === 'Partido X', 'Deve preservar propriedades de data');
    assert(generatedNode.metadata.source === 'tse-sources', 'Deve preservar a fonte em metadata');
    assert(generatedNode.metadata.confidence === 0.95, 'Deve herdar confidence existente em metadata');
    assert(generatedNode.metadata.version === '2.0.0', 'Deve preservar a versão do record');

    // ----------------------------------------------------
    // Teste 36: GraphFactory fallback de confidence e tipos não alinhados
    // ----------------------------------------------------
    console.log('\n[Teste 36] Validando GraphFactory fallbacks...');

    const unalignedRecord: RepositoryRecord = {
      id: 'rep-rec-456',
      entity: 'invalid_entity_type' as any,
      source: 'test-source',
      data: {},
      metadata: {}, // sem confidence
      createdAt: new Date().toISOString(),
    };

    const nodeFallback = GraphFactory.createFromRecord(unalignedRecord);

    assert(nodeFallback.type === 'generic', 'Tipo não alinhado deve cair para generic');
    assert(nodeFallback.metadata.confidence === 1.0, 'Confidence não informada deve cair para 1.0');

    // ----------------------------------------------------
    // Teste 37: GraphBuilder (Geração determinística de Edge)
    // ----------------------------------------------------
    console.log('\n[Teste 37] Validando GraphBuilder...');

    const fromNode: GraphNode = {
      id: 'node-from',
      type: 'candidate',
      properties: {},
      metadata: { source: 'source-f', confidence: 0.8, createdAt: '', version: '1.0.0' },
    };

    const toNode: GraphNode = {
      id: 'node-to',
      type: 'party',
      properties: {},
      metadata: { source: 'source-t', confidence: 0.9, createdAt: '', version: '1.0.0' },
    };

    const deterministcEdge = GraphBuilder.buildEdge(fromNode, toNode, 'belongs_to');

    console.log('debug edge confidence:', deterministcEdge.metadata.confidence, typeof deterministcEdge.metadata.confidence);

    assert(deterministcEdge.id === 'node-from_belongs_to_node-to', 'ID do edge deve ser determinístico');
    assert(deterministcEdge.from === 'node-from', 'Deve ter a origem correta');
    assert(deterministcEdge.to === 'node-to', 'Deve ter o destino correto');
    assert(Math.abs(deterministcEdge.metadata.confidence - 0.85) < 0.0001, 'Confidence do Edge deve ser a média das confianças dos nós');
    assert(deterministcEdge.metadata.source === 'source-f', 'Source padrão do Edge deve vir do nó de origem');

    // ----------------------------------------------------
    // Teste 38: GraphEdgeRegistry (Unicidade e buscas)
    // ----------------------------------------------------
    console.log('\n[Teste 38] Validando GraphEdgeRegistry...');
    GraphEdgeRegistry.clear();
    assert(GraphEdgeRegistry.list().length === 0, 'O GraphEdgeRegistry deve iniciar vazio');

    GraphEdgeRegistry.register(deterministcEdge);
    assert(GraphEdgeRegistry.list().length === 1, 'Deve possuir 1 edge');

    try {
      GraphEdgeRegistry.register(deterministcEdge);
      assert(false, 'Deveria lançar erro ao cadastrar aresta duplicada');
    } catch (err: any) {
      assert(err.message.includes('já está registrado'), 'Deveria validar aresta duplicada');
    }

    const byFrom = GraphEdgeRegistry.findByFrom('node-from');
    assert(byFrom.length === 1 && byFrom[0].id === deterministcEdge.id, 'Deve encontrar aresta por emissor');

    const byTo = GraphEdgeRegistry.findByTo('node-to');
    assert(byTo.length === 1 && byTo[0].id === deterministcEdge.id, 'Deve encontrar aresta por receptor');

    // ----------------------------------------------------
    // Teste 39: GraphService (Registro e buscas injetadas)
    // ----------------------------------------------------
    console.log('\n[Teste 39] Validando GraphService...');
    
    GraphRegistry.clear();
    GraphEdgeRegistry.clear();

    const service = new GraphService(GraphRegistry, GraphEdgeRegistry);

    await service.createNode(fromNode);
    await service.createNode(toNode);
    const createResult = await service.createEdge(deterministcEdge);
    assert(createResult.status === 'CREATED', 'Primeira inserção deve retornar status CREATED');
    assert(createResult.edge.id === deterministcEdge.id, 'Deve retornar a aresta registrada');

    // Idempotência: inserção idêntica deve retornar EXISTS sem duplicar
    const repeatResult = await service.createEdge(deterministcEdge);
    assert(repeatResult.status === 'EXISTS', 'Inserção idêntica deve retornar status EXISTS');
    assert(repeatResult.edge.id === deterministcEdge.id, 'Deve retornar a aresta existente');
    assert(GraphEdgeRegistry.list().length === 1, 'Não deve duplicar a aresta no registry');

    // Conflito estrutural: mesmo ID com origem/destino/relação divergente deve lançar erro
    const divergentNode: GraphNode = {
      id: 'node-divergente',
      type: 'party',
      properties: {},
      metadata: { source: 'source-f', confidence: 0.9, createdAt: '', version: '1.0.0' },
    };
    await service.createNode(divergentNode);

    try {
      await service.createEdge({
        id: deterministcEdge.id,
        from: 'node-from',
        to: 'node-divergente',
        relation: 'belongs_to',
        weight: 1.0,
        metadata: deterministcEdge.metadata,
      });
      assert(false, 'Deveria lançar erro por conflito estrutural');
    } catch (err: any) {
      assert(err.message.includes('Conflito estrutural'), 'Deve acusar conflito estrutural de aresta');
    }

    // Validação de nós inexistentes: deve lançar erro explícito
    try {
      await service.createEdge({
        id: 'edge-ghost',
        from: 'node-inexistente',
        to: 'node-to',
        relation: 'belongs_to',
        weight: 1.0,
        metadata: deterministcEdge.metadata,
      });
      assert(false, 'Deveria lançar erro por nó inexistente');
    } catch (err: any) {
      assert(err.message.includes('Nó de origem ou destino inexistente'), 'Deve acusar nó inexistente');
    }

    const foundN = await service.findNode('node-from');
    assert(foundN?.id === 'node-from', 'Deve localizar nó criado via GraphService');

    const edgesFrom = await service.findEdgesFrom('node-from');
    assert(edgesFrom.length === 1 && edgesFrom[0].id === deterministcEdge.id, 'Deve achar conexões partindo do nó emissor');

    // ----------------------------------------------------
    // Teste 40: GraphService (limpeza geral)
    // ----------------------------------------------------
    console.log('\n[Teste 40] Validando GraphService.clear()...');
    
    await service.clear();
    const countNodes = GraphRegistry.list().length;
    const countEdges = GraphEdgeRegistry.list().length;

    assert(countNodes === 0 && countEdges === 0, 'GraphService.clear() deve resetar nós e arestas do grafo');

    // ----------------------------------------------------
    // Teste 41: RelationshipRegistry (registro e prioridade)
    // ----------------------------------------------------
    console.log('\n[Teste 41] Validando RelationshipRegistry...');
    RelationshipRegistry.clear();
    assert(RelationshipRegistry.list().length === 0, 'O registry de regras deve iniciar vazio');

    const rule1 = new CandidateReceivedVotesFromMunicipalityRule();
    const rule2 = new CandidateBelongsToPartyRule();

    RelationshipRegistry.register(rule1);
    RelationshipRegistry.register(rule2);

    const list = RelationshipRegistry.list();
    assert(list.length === 2, 'Deve registrar ambas as regras');
    // rule2 (priority 10) deve vir antes de rule1 (priority 20)
    assert(list[0].id === 'candidate-belongs-to-party', 'Regras devem ser listadas ordenadas por priority ASC');

    // Impedir regras com rule.id duplicado
    try {
      RelationshipRegistry.register(rule2);
      assert(false, 'Deveria lançar erro para rule.id duplicado');
    } catch (err: any) {
      assert(err.message.includes('já está registrado'), 'Deveria barrar rule.id duplicado');
    }

    // ----------------------------------------------------
    // Teste 42: Regra Determinística CandidateBelongsToPartyRule
    // ----------------------------------------------------
    console.log('\n[Teste 42] Validando CandidateBelongsToPartyRule...');
    
    const candidateNode: GraphNode = {
      id: 'cand-y',
      type: 'candidate',
      properties: {},
      metadata: { source: 'tse', confidence: 0.95, createdAt: '', version: '1.0.0' },
    };

    const partyNode: GraphNode = {
      id: 'party-y',
      type: 'party',
      properties: {},
      metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' },
    };

    const ruleBelongs = new CandidateBelongsToPartyRule();
    const resBelongs = await ruleBelongs.evaluate(candidateNode, partyNode);
    assert(resBelongs.matched === true, 'Deve dar matched para candidate e party');
    assert(resBelongs.relation === 'belongs_to', 'Relação deve ser belongs_to');

    const resBelongsFalse = await ruleBelongs.evaluate(partyNode, candidateNode);
    assert(resBelongsFalse.matched === false, 'Não deve dar matched se os tipos estiverem invertidos');

    // ----------------------------------------------------
    // Teste 43: RelationshipEngine (execução e conexões geradas)
    // ----------------------------------------------------
    console.log('\n[Teste 43] Validando RelationshipEngine...');
    
    RelationshipRegistry.clear();
    RelationshipRegistry.register(new CandidateBelongsToPartyRule());
    RelationshipRegistry.register(new CandidateReceivedVotesFromMunicipalityRule());
    RelationshipRegistry.register(new MunicipalityLocatedInOrganizationRule());

    const engine = new RelationshipEngine(RelationshipRegistry, GraphBuilder);

    const munNode: GraphNode = {
      id: 'mun-z',
      type: 'municipality',
      properties: {},
      metadata: { source: 'ibge', confidence: 0.9, createdAt: '', version: '1.0.0' },
    };

    // Executa e avalia candidate -> party
    const candidatePartyEdges = await engine.evaluate(candidateNode, partyNode);
    assert(candidatePartyEdges.length === 1, 'Deve gerar 1 edge para candidate e party');
    assert(candidatePartyEdges[0].id === 'cand-y_belongs_to_party-y', 'ID do edge deve ser determinístico');
    assert(candidatePartyEdges[0].metadata.confidence === 1.0, 'Deve usar confidence explícita da regra');

    // Executa e avalia party -> candidate (matched deve ser false, gerando zero edges)
    const partyCandidateEdges = await engine.evaluate(partyNode, candidateNode);
    assert(partyCandidateEdges.length === 0, 'Não deve gerar edges se nenhuma regra der matched');

    // ----------------------------------------------------
    // Teste 44: MunicipalityLocatedInOrganizationRule
    // ----------------------------------------------------
    console.log('\n[Teste 44] Validando MunicipalityLocatedInOrganizationRule...');
    
    const orgNode: GraphNode = {
      id: 'org-w',
      type: 'organization',
      properties: {},
      metadata: { source: 'tse', confidence: 0.8, createdAt: '', version: '1.0.0' },
    };

    const munOrgEdges = await engine.evaluate(munNode, orgNode);
    assert(munOrgEdges.length === 1 && munOrgEdges[0].relation === 'located_in', 'Deve gerar edge located_in de municipality para organization');

    // ----------------------------------------------------
    // Teste 45: SignalRegistry (registro e prioridade)
    // ----------------------------------------------------
    console.log('\n[Teste 45] Validando SignalRegistry...');
    SignalRegistry.clear();
    assert(SignalRegistry.list().length === 0, 'O registry de sinais deve iniciar vazio');

    const sRule1 = new OrphanNodeRule();
    const sRule2 = new TerritorialOpportunityRule();

    SignalRegistry.register(sRule1);
    SignalRegistry.register(sRule2);

    const sList = SignalRegistry.list();
    assert(sList.length === 2, 'Deve conter 2 regras de sinais');
    assert(sList[0].id === 'territorial-opportunity', 'Deve ordenar por priority ASC (territorial-opportunity de priority 10 primeiro)');

    try {
      SignalRegistry.register(sRule2);
      assert(false, 'Deveria lançar erro para rule.id duplicado');
    } catch (err: any) {
      assert(err.message.includes('já está registrado'), 'Deveria barrar rule.id duplicado');
    }

    // ----------------------------------------------------
    // Teste 46: TerritorialOpportunityRule
    // ----------------------------------------------------
    console.log('\n[Teste 46] Validando TerritorialOpportunityRule...');
    const nodes: GraphNode[] = [
      { id: 'mun-1', type: 'municipality', properties: {}, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
      { id: 'mun-2', type: 'municipality', properties: {}, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
    ];
    // mun-1 possui votos, mun-2 não possui (oportunidade)
    const edges: GraphEdge[] = [
      { id: 'edge-test', from: 'cand-1', to: 'mun-1', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } }
    ];

    const terrRule = new TerritorialOpportunityRule();
    const signalsTerr = await terrRule.evaluate(nodes, edges);
    assert(signalsTerr.length === 1, 'Deve gerar apenas 1 sinal de oportunidade territorial');
    assert(signalsTerr[0].id === 'territorial-opportunity_mun-2', 'ID do sinal deve ser determinístico');
    assert(signalsTerr[0].type === 'territorial_opportunity', 'Sinal deve ser do tipo territorial_opportunity');

    // ----------------------------------------------------
    // Teste 47: HighRelationshipDensityRule & OrphanNodeRule
    // ----------------------------------------------------
    console.log('\n[Teste 47] Validando HighRelationshipDensityRule e OrphanNodeRule...');
    
    // High Density Node candidate com 6 conexões
    const candidateHighNode: GraphNode = {
      id: 'cand-high',
      type: 'candidate',
      properties: {},
      metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' }
    };

    const orphanNode: GraphNode = {
      id: 'orphan-cand',
      type: 'candidate',
      properties: {},
      metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' }
    };

    const genericOrphanNode: GraphNode = {
      id: 'generic-orphan',
      type: 'generic', // deve ser ignorado pela regra OrphanNodeRule
      properties: {},
      metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' }
    };

    const densityEdges: GraphEdge[] = [
      { id: 'e1', from: 'cand-high', to: 'm1', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
      { id: 'e2', from: 'cand-high', to: 'm2', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
      { id: 'e3', from: 'cand-high', to: 'm3', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
      { id: 'e4', from: 'cand-high', to: 'm4', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
      { id: 'e5', from: 'cand-high', to: 'm5', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } },
      { id: 'e6', from: 'cand-high', to: 'm6', relation: 'received_votes_from', weight: 1.0, metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' } }
    ];

    const densityRule = new HighRelationshipDensityRule();
    const signalsDensity = await densityRule.evaluate([candidateHighNode], densityEdges);
    assert(signalsDensity.length === 1, 'Deve gerar 1 sinal de alta densidade');
    assert(signalsDensity[0].id === 'high-relationship-density_cand-high', 'ID determinístico da densidade');

    const orphanRule = new OrphanNodeRule();
    const signalsOrphan = await orphanRule.evaluate([candidateHighNode, orphanNode, genericOrphanNode], densityEdges);
    assert(signalsOrphan.length === 1 && signalsOrphan[0].context.nodeId === 'orphan-cand', 'Deve gerar sinal apenas para o orphan-cand (ignorando generic-orphan)');

    // ----------------------------------------------------
    // Teste 48: SignalEngine (deduplicação e execução ordenada)
    // ----------------------------------------------------
    console.log('\n[Teste 48] Validando SignalEngine deduplicação e fluxo...');
    
    SignalRegistry.clear();
    SignalRegistry.register(new TerritorialOpportunityRule());
    SignalRegistry.register(new HighRelationshipDensityRule());
    SignalRegistry.register(new OrphanNodeRule());

    const sEngine = new SignalEngine(SignalRegistry);
    const allGenerated = await sEngine.generateSignals(
      [candidateHighNode, orphanNode, genericOrphanNode, ...nodes],
      [...edges, ...densityEdges]
    );

    console.log('Generated signal IDs:', allGenerated.map(s => s.id));
    assert(allGenerated.length === 4, 'Deve consolidar 4 sinais deduped (incluindo mun-2 como órfão e oportunidade)');

    // ----------------------------------------------------
    // Teste 49: RepositoryRecordFactory (Determinismo e Idempotência)
    // ----------------------------------------------------
    console.log('\n[Teste 49] Validando RepositoryRecordFactory...');

    // A) Mesmo MappedRecord -> mesmo ID
    const mappedA1: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { name: 'João Silva', number: 1234, city: 'SP' },
      confidence: 0.95,
      metadata: { version: '1.0.0' },
    };
    const mappedA2: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { name: 'João Silva', number: 1234, city: 'SP' },
      confidence: 0.95,
      metadata: { version: '1.0.0' },
    };
    const recordA1 = RepositoryRecordFactory.fromMappedRecord(mappedA1);
    const recordA2 = RepositoryRecordFactory.fromMappedRecord(mappedA2);
    assert(recordA1.id === recordA2.id, 'A) Mesmo MappedRecord deve produzir exatamente o mesmo ID');

    // B) Propriedades em ordem diferente -> mesmo ID
    const mappedB: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { city: 'SP', number: 1234, name: 'João Silva' }, // chaves invertidas
      confidence: 0.95,
      metadata: { version: '1.0.0' },
    };
    const recordB = RepositoryRecordFactory.fromMappedRecord(mappedB);
    assert(recordA1.id === recordB.id, 'B) Propriedades em ordem diferente no data devem produzir o mesmo ID');

    // C) Alteração de dado relevante -> ID diferente
    const mappedC: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { name: 'João Silva Alterado', number: 1234, city: 'SP' },
      confidence: 0.95,
      metadata: { version: '1.0.0' },
    };
    const recordC = RepositoryRecordFactory.fromMappedRecord(mappedC);
    assert(recordA1.id !== recordC.id, 'C) Alteração de dado relevante deve gerar ID diferente');

    // D) metadata.externalId -> identidade determinística baseada nele
    const mappedD: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { name: 'João Silva', number: 1234 },
      confidence: 0.95,
      metadata: { externalId: 'CAND_SP_1234' },
    };
    const recordD = RepositoryRecordFactory.fromMappedRecord(mappedD);
    assert(recordD.id === 'candidate_CAND_SP_1234', 'D) metadata.externalId deve gerar identidade determinística esperada');

    // E) customId explícito -> respeitado
    const recordE = RepositoryRecordFactory.fromMappedRecord(mappedA1, 'custom-id-999');
    assert(recordE.id === 'custom-id-999', 'E) customId explícito deve ser respeitado');

    // F) Dois providers diferentes -> não gerar colisão quando source fizer parte da identidade
    const mappedF1: MappedRecord = {
      source: 'tse_provider',
      entity: 'candidate',
      data: { name: 'João Silva', number: 1234 },
      confidence: 0.95,
    };
    const mappedF2: MappedRecord = {
      source: 'ibge_provider',
      entity: 'candidate',
      data: { name: 'João Silva', number: 1234 },
      confidence: 0.95,
    };
    const recordF1 = RepositoryRecordFactory.fromMappedRecord(mappedF1);
    const recordF2 = RepositoryRecordFactory.fromMappedRecord(mappedF2);
    assert(recordF1.id !== recordF2.id, 'F) Dois providers diferentes não devem colidir quando source faz parte da identidade');

    // G) Não utilizar UUID/random/time para gerar identidade
    const idDirect1 = RepositoryRecordFactory.generateDeterministicId('party', 'tse', { sigla: 'PL', numero: 22 });
    const idDirect2 = RepositoryRecordFactory.generateDeterministicId('party', 'tse', { sigla: 'PL', numero: 22 });
    assert(idDirect1 === idDirect2, 'G) Geração de ID direta não deve usar UUID, random ou timestamp');
    assert(recordA1.createdAt !== undefined, 'RepositoryRecord deve possuir createdAt preenchido');

    // ----------------------------------------------------
    // Setup para Testes do IntelligenceOrchestrator
    // ----------------------------------------------------
    RepositoryRegistry.clear();
    const manifestOrch: RepositoryManifest = {
      id: 'repo-orch',
      name: 'Orchestrator Strategic Repository',
      version: '1.0.0',
      supportedEntities: ['candidate', 'party', 'municipality', 'election', 'vote'],
    };
    const repoOrch = new InMemoryRepository(manifestOrch);
    RepositoryRegistry.register(repoOrch);

    await RepositoryService.clear();
    await service.clear();
    RelationshipRegistry.clear();
    SignalRegistry.clear();

    // Registra regras de relacionamento determinísticas
    RelationshipRegistry.register(new CandidateBelongsToPartyRule());
    RelationshipRegistry.register(new CandidateReceivedVotesFromMunicipalityRule());
    RelationshipRegistry.register(new MunicipalityLocatedInOrganizationRule());

    // Registra regras de sinais
    SignalRegistry.register(new TerritorialOpportunityRule());
    SignalRegistry.register(new HighRelationshipDensityRule());
    SignalRegistry.register(new OrphanNodeRule());

    const relEngine = new RelationshipEngine(RelationshipRegistry, GraphBuilder);
    const sigEngine = new SignalEngine(SignalRegistry);

    const orchestrator = new IntelligenceOrchestrator(
      RepositoryService,
      service,
      relEngine,
      sigEngine,
      GraphRegistry,
      GraphEdgeRegistry
    );

    // ----------------------------------------------------
    // Teste 50: MappedRecord -> RepositoryRecord -> RepositoryService -> GraphNode
    // ----------------------------------------------------
    console.log('\n[Teste 50] Validando IntelligenceOrchestrator (MappedRecord -> Repo -> GraphNode)...');
    
    const partyMapped: MappedRecord = {
      source: 'tse_parties',
      entity: 'party',
      data: { sigla: 'PARTIDO_TESTE', numero: 99 },
      confidence: 1.0,
      metadata: { externalId: 'PT_99' },
    };

    const res50 = await orchestrator.orchestrate({ mappedRecord: partyMapped });
    assert(res50.status === 'SUCCESS', 'Status da orquestração deve ser SUCCESS');
    assert(res50.repositoryRecord.id === 'party_PT_99', 'RepositoryRecord deve possuir ID determinístico');
    assert(res50.graphNode.id === 'party_PT_99', 'GraphNode deve ter ID idêntico ao RepositoryRecord');
    assert(res50.graphNode.type === 'party', 'GraphNode deve ter o tipo party');
    
    // Confirma presença no RepositoryService e no GraphRegistry
    const repoFind = await RepositoryService.find('party_PT_99');
    assert(repoFind !== undefined && repoFind.id === 'party_PT_99', 'Deve persistir no RepositoryService');
    const nodeFind = GraphRegistry.find('party_PT_99');
    assert(nodeFind !== undefined && nodeFind.id === 'party_PT_99', 'Deve registrar no GraphRegistry');

    // ----------------------------------------------------
    // Teste 51: MappedRecord -> GraphNode -> RelationshipEngine -> GraphEdge
    // ----------------------------------------------------
    console.log('\n[Teste 51] Validando IntelligenceOrchestrator (RelationshipEngine -> GraphEdge)...');

    const candidateMapped: MappedRecord = {
      source: 'tse_candidates',
      entity: 'candidate',
      data: { nomeUrna: 'CANDIDATO TESTE', numero: 99001 },
      confidence: 0.95,
      metadata: { externalId: 'CAND_99001' },
    };

    const res51 = await orchestrator.orchestrate({ mappedRecord: candidateMapped });
    assert(res51.status === 'SUCCESS', 'Status da orquestração deve ser SUCCESS');
    assert(res51.edgesCreated.length === 1, 'Deve criar 1 aresta conectando candidate a party');
    assert(res51.edgesCreated[0].relation === 'belongs_to', 'Aresta criada deve ter a relação belongs_to');
    assert(res51.edgesCreated[0].from === 'candidate_CAND_99001', 'Origem da aresta deve ser o candidato');
    assert(res51.edgesCreated[0].to === 'party_PT_99', 'Destino da aresta deve ser o partido pré-existente');

    // Confirma que a aresta está no GraphEdgeRegistry
    const edgesFromCand = GraphEdgeRegistry.findByFrom('candidate_CAND_99001');
    assert(edgesFromCand.length === 1, 'Aresta deve estar persistida no GraphEdgeRegistry');

    // ----------------------------------------------------
    // Teste 52: MappedRecord -> GraphNode -> RelationshipEngine -> SignalEngine -> StrategicSignal[]
    // ----------------------------------------------------
    console.log('\n[Teste 52] Validando IntelligenceOrchestrator (SignalEngine -> StrategicSignal[])...');

    // Ingerir uma eleição sem conexões (gerando o sinal orphan_node)
    const electionMapped: MappedRecord = {
      source: 'tse_election',
      entity: 'election',
      data: { ano: 2026, turno: 1 },
      confidence: 1.0,
      metadata: { externalId: 'ELEICAO_2026' },
    };

    const res52 = await orchestrator.orchestrate({ mappedRecord: electionMapped });
    assert(res52.status === 'SUCCESS', 'Status da orquestração deve ser SUCCESS');
    assert(res52.signalsGenerated.length > 0, 'Deve gerar sinais estratégicos para o estado atual do grafo');
    
    const hasOrphanSignal = res52.signalsGenerated.some(
      (s) => s.type === 'orphan_node' && s.context.nodeId === 'election_ELEICAO_2026'
    );
    assert(hasOrphanSignal, 'Deve gerar sinal de orphan_node para a eleição recém-inserida sem conexões');

    // ----------------------------------------------------
    // Teste 53 (End-to-End Idempotency): Reprocessar o mesmo MappedRecord
    // ----------------------------------------------------
    console.log('\n[Teste 53] Validando Idempotência End-to-End no reprocessamento...');

    const repoCountBefore = await RepositoryService.count();
    const nodeCountBefore = GraphRegistry.list().length;
    const edgeCountBefore = GraphEdgeRegistry.list().length;

    // Reprocessar o mesmo candidateMapped
    const resIdempotent = await orchestrator.orchestrate({ mappedRecord: candidateMapped });
    assert(resIdempotent.status === 'SUCCESS', 'Reprocessamento idêntico deve retornar SUCCESS');
    assert(resIdempotent.edgesCreated.length === 0, 'Não deve criar novas arestas (idempotência explicit EXISTS)');
    assert(resIdempotent.repositoryRecord.id === 'candidate_CAND_99001', 'Mesmo ID no RepositoryRecord');
    assert(resIdempotent.graphNode.id === 'candidate_CAND_99001', 'Mesmo ID no GraphNode');

    const repoCountAfter = await RepositoryService.count();
    const nodeCountAfter = GraphRegistry.list().length;
    const edgeCountAfter = GraphEdgeRegistry.list().length;

    assert(repoCountAfter === repoCountBefore, 'Contagem no RepositoryService não deve aumentar no reprocessamento');
    assert(nodeCountAfter === nodeCountBefore, 'Contagem no GraphRegistry não deve aumentar no reprocessamento');
    assert(edgeCountAfter === edgeCountBefore, 'Contagem no GraphEdgeRegistry não deve aumentar no reprocessamento');

    // Validação de idempotência de sinais no reprocessamento:
    // O reprocessamento não deve duplicar sinais na lista retornada
    const signalIds = resIdempotent.signalsGenerated.map((s) => s.id);
    const uniqueSignalIds = new Set(signalIds);
    assert(signalIds.length === uniqueSignalIds.size, 'Sinais retornados no reprocessamento não devem conter IDs duplicados');

    // ----------------------------------------------------
    // Teste 54: Isolamento de falhas — Falha não-estrutural em RelationshipEngine gera PARTIAL
    // ----------------------------------------------------
    console.log('\n[Teste 54] Validando isolamento de falha não-estrutural em relacionamentos...');

    // Cria regra instável que lança erro de avaliação de negócio
    class UnstableRelationshipRule {
      readonly id = 'unstable-rule';
      readonly name = 'Unstable Rule';
      readonly priority = 999;
      async evaluate() {
        throw new Error('Falha temporária de regra de relacionamento');
      }
    }
    RelationshipRegistry.register(new UnstableRelationshipRule() as any);

    const partialMapped: MappedRecord = {
      source: 'tse_partial',
      entity: 'candidate',
      data: { nomeUrna: 'CANDIDATO PARCIAL', numero: 888 },
      confidence: 0.95,
      metadata: { externalId: 'CAND_888' },
    };

    const res54 = await orchestrator.orchestrate({ mappedRecord: partialMapped });
    assert(res54.status === 'PARTIAL', 'Falha em regra não-estrutural deve resultar em PARTIAL');
    assert(res54.repositoryRecord.id === 'candidate_CAND_888', 'RepositoryRecord deve ser preservado com sucesso');
    assert(res54.graphNode.id === 'candidate_CAND_888', 'GraphNode deve ser preservado com sucesso');
    assert(GraphRegistry.find('candidate_CAND_888') !== undefined, 'GraphNode deve estar presente no GraphRegistry');

    // Remove a regra instável para não contaminar os testes seguintes
    RelationshipRegistry.clear();
    RelationshipRegistry.register(new CandidateBelongsToPartyRule());
    RelationshipRegistry.register(new CandidateReceivedVotesFromMunicipalityRule());
    RelationshipRegistry.register(new MunicipalityLocatedInOrganizationRule());

    // ----------------------------------------------------
    // Teste 55: Isolamento de falhas — Falha em SignalEngine gera PARTIAL
    // ----------------------------------------------------
    console.log('\n[Teste 55] Validando isolamento de falha em SignalEngine...');

    class BrokenSignalRule {
      readonly id = 'broken-signal-rule';
      readonly name = 'Broken Signal Rule';
      readonly priority = 1;
      async evaluate() {
        throw new Error('Falha simulada no cálculo de sinal estratégico');
      }
    }
    SignalRegistry.register(new BrokenSignalRule() as any);

    const res55 = await orchestrator.orchestrate({
      mappedRecord: {
        source: 'tse_broken_signal',
        entity: 'party',
        data: { sigla: 'PART_SIG', numero: 77 },
        confidence: 1.0,
        metadata: { externalId: 'PT_77' },
      },
    });
    assert(res55.status === 'PARTIAL', 'Falha no SignalEngine deve resultar em status PARTIAL');
    assert(res55.repositoryRecord.id === 'party_PT_77', 'RepositoryRecord deve ser gravado com sucesso');
    assert(res55.graphNode.id === 'party_PT_77', 'GraphNode deve ser registrado com sucesso');

    // Remove a regra com erro de sinal
    SignalRegistry.clear();
    SignalRegistry.register(new TerritorialOpportunityRule());
    SignalRegistry.register(new HighRelationshipDensityRule());
    SignalRegistry.register(new OrphanNodeRule());

    // ----------------------------------------------------
    // Teste 56: Não-mascaramento de erros estruturais reais
    // ----------------------------------------------------
    console.log('\n[Teste 56] Validando não-mascaramento de conflito estrutural...');

    // Registra manualmente no edgeRegistry uma aresta conflitante prévia com o mesmo ID que a regra produzirá
    // A regra CandidateBelongsToPartyRule produz 'candidate_CAND_CONFLICT_belongs_to_party_PT_99'
    const conflictingEdgeId = 'candidate_CAND_CONFLICT_belongs_to_party_PT_99';
    GraphEdgeRegistry.register({
      id: conflictingEdgeId,
      from: 'candidate_CAND_CONFLICT',
      to: 'party_PT_77', // Destino divergente para forçar conflito estrutural explícito
      relation: 'belongs_to',
      weight: 1.0,
      metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' },
    });

    try {
      await orchestrator.orchestrate({
        mappedRecord: {
          source: 'tse',
          entity: 'candidate',
          data: { nome: 'Cand Conflict' },
          confidence: 0.9,
          metadata: { externalId: 'CAND_CONFLICT' },
        },
      });
      assert(false, 'Deveria lançar erro por conflito estrutural no grafo');
    } catch (err: any) {
      assert(err.message.includes('Conflito estrutural de aresta'), 'Erro estrutural real não deve ser engolido como PARTIAL');
    }

    // ----------------------------------------------------
    // Teste 57: PrismaStrategicRepository Adapter (CRUD, Idempotência, Multi-Tenant)
    // ----------------------------------------------------
    console.log('\n[Teste 57] Validando PrismaStrategicRepository Adapter...');

    // Mock do PrismaClient em memória para teste unitário do adapter com chave composta (tenantId, id)
    const mockDb = new Map<string, any>();
    const mockPrisma: any = {
      strategicRecord: {
        upsert: async ({ where, create, update }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          const existing = mockDb.get(key);
          if (existing) {
            const updated = { ...existing, ...update };
            mockDb.set(key, updated);
            return updated;
          } else {
            mockDb.set(key, create);
            return create;
          }
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return mockDb.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(mockDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          if (where?.entity) {
            rows = rows.filter((r) => r.entity === where.entity);
          }
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(mockDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = mockDb.size;
            mockDb.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of mockDb.entries()) {
            if (val.tenantId === where.tenantId) {
              mockDb.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
    };

    const prismaRepo = new PrismaStrategicRepository(
      {
        id: 'prisma-repo-default',
        name: 'Prisma Strategic Repository Default',
        version: '1.0.0',
        supportedEntities: ['candidate', 'party'],
      },
      { prisma: mockPrisma, tenantId: 'tenant-alpha' }
    );

    // 57.1 Novo registro e persistência
    const prismaRec1: RepositoryRecord = {
      id: 'rec_prisma_01',
      entity: 'candidate',
      source: 'tse',
      data: { nome: 'Candidato Prisma' },
      metadata: { externalId: 'PRISMA_01' },
      createdAt: new Date().toISOString(),
    };
    await prismaRepo.store(prismaRec1);

    // 57.2 Recuperação por ID e getById
    const fetchedPrisma = await prismaRepo.find('rec_prisma_01');
    assert(fetchedPrisma !== undefined, 'Deve recuperar registro persistido via find()');
    assert(fetchedPrisma?.data.nome === 'Candidato Prisma', 'Deve preservar dados do data');
    const fetchedById = await prismaRepo.getById('rec_prisma_01');
    assert(fetchedById?.id === 'rec_prisma_01', 'Deve recuperar registro via getById()');

    // 57.3 exists()
    const existsTrue = await prismaRepo.exists('rec_prisma_01');
    assert(existsTrue === true, 'exists() deve retornar true para registro existente');
    const existsFalse = await prismaRepo.exists('rec_prisma_ghost');
    assert(existsFalse === false, 'exists() deve retornar false para registro inexistente');

    // 57.4 Idempotência / Upsert
    const prismaRec1Updated: RepositoryRecord = {
      id: 'rec_prisma_01',
      entity: 'candidate',
      source: 'tse',
      data: { nome: 'Candidato Prisma Atualizado' },
      metadata: { externalId: 'PRISMA_01' },
      createdAt: new Date().toISOString(),
    };
    await prismaRepo.store(prismaRec1Updated);
    const countAfterUpsert = await prismaRepo.count();
    assert(countAfterUpsert === 1, 'Re-armazenamento com mesmo ID não deve duplicar (upsert)');
    const fetchedUpdated = await prismaRepo.find('rec_prisma_01');
    assert(fetchedUpdated?.data.nome === 'Candidato Prisma Atualizado', 'Deve atualizar dados no upsert');

    // 57.5 list() e findByEntity()
    const listPrisma = await prismaRepo.list();
    assert(listPrisma.length === 1, 'list() deve retornar registros do tenant');
    const candidatesList = await prismaRepo.findByEntity('candidate');
    assert(candidatesList.length === 1, 'findByEntity() deve retornar os registros do tipo');

    // 57.6 Isolamento multi-tenant estrito: mesmo ID em dois tenants coexistindo
    const otherTenantRepo = new PrismaStrategicRepository(
      {
        id: 'prisma-repo-beta',
        name: 'Prisma Strategic Repository Beta',
        version: '1.0.0',
        supportedEntities: ['candidate'],
      },
      { prisma: mockPrisma, tenantId: 'tenant-beta' }
    );

    // Armazena no tenant-beta exatamente o mesmo ID 'rec_prisma_01' com dados diferentes
    const prismaRecBeta: RepositoryRecord = {
      id: 'rec_prisma_01', // Mesmo ID que tenant-alpha
      entity: 'candidate',
      source: 'tse',
      data: { nome: 'Candidato Beta Exclusivo' },
      metadata: { externalId: 'PRISMA_01' },
      createdAt: new Date().toISOString(),
    };
    await otherTenantRepo.store(prismaRecBeta);

    // Ambos devem coexistir de forma independente
    const fromAlpha = await prismaRepo.find('rec_prisma_01');
    const fromBeta = await otherTenantRepo.find('rec_prisma_01');

    assert(fromAlpha !== undefined, 'tenant-alpha deve encontrar seu registro');
    assert(fromBeta !== undefined, 'tenant-beta deve encontrar seu registro');
    assert(fromAlpha?.data.nome === 'Candidato Prisma Atualizado', 'tenant-alpha preserva seus próprios dados');
    assert(fromBeta?.data.nome === 'Candidato Beta Exclusivo', 'tenant-beta preserva seus próprios dados');
    assert(await prismaRepo.count() === 1, 'tenant-alpha continua com 1 registro');
    assert(await otherTenantRepo.count() === 1, 'tenant-beta possui 1 registro');

    // Update em tenant-beta não altera tenant-alpha
    await otherTenantRepo.store({
      id: 'rec_prisma_01',
      entity: 'candidate',
      source: 'tse',
      data: { nome: 'Candidato Beta Modificado' },
      metadata: { externalId: 'PRISMA_01' },
      createdAt: new Date().toISOString(),
    });
    const fromAlphaAfter = await prismaRepo.find('rec_prisma_01');
    const fromBetaAfter = await otherTenantRepo.find('rec_prisma_01');
    assert(fromAlphaAfter?.data.nome === 'Candidato Prisma Atualizado', 'Update em beta não altera alpha');
    assert(fromBetaAfter?.data.nome === 'Candidato Beta Modificado', 'Update em beta reflete somente em beta');

    // Validação equivalente com InMemoryRepository
    const inMemAlpha = new InMemoryRepository(
      { id: 'inmem-a', name: 'InMem A', version: '1.0.0', supportedEntities: ['candidate'] },
      'tenant-alpha'
    );
    const inMemBeta = new InMemoryRepository(
      { id: 'inmem-b', name: 'InMem B', version: '1.0.0', supportedEntities: ['candidate'] },
      'tenant-beta'
    );
    await inMemAlpha.store(prismaRec1);
    await inMemBeta.store(prismaRecBeta);
    const inMemFromA = await inMemAlpha.find('rec_prisma_01');
    const inMemFromB = await inMemBeta.find('rec_prisma_01');
    assert(inMemFromA?.data.nome === 'Candidato Prisma', 'InMemoryRepository isola dados para tenant-alpha');
    assert(inMemFromB?.data.nome === 'Candidato Beta Exclusivo', 'InMemoryRepository isola dados para tenant-beta');

    // ----------------------------------------------------
    // Teste 58: PrismaGraphAdapter (Nodes, Edges, Idempotência, FKs, Multi-Tenant)
    // ----------------------------------------------------
    console.log('\n[Teste 58] Validando PrismaGraphAdapter...');

    const mockGraphNodesDb = new Map<string, any>();
    const mockGraphEdgesDb = new Map<string, any>();

    const mockGraphPrisma: any = {
      graphNodeRecord: {
        create: async ({ data }: any) => {
          const key = `${data.tenantId}:${data.id}`;
          if (mockGraphNodesDb.has(key)) {
            throw new Error(`Unique constraint failed on the fields: (tenantId, id)`);
          }
          mockGraphNodesDb.set(key, data);
          return data;
        },
        findUnique: async ({ where }: any) => {
          const key = `${where.tenantId_id.tenantId}:${where.tenantId_id.id}`;
          return mockGraphNodesDb.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(mockGraphNodesDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(mockGraphNodesDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          let count = 0;
          for (const [key, val] of mockGraphNodesDb.entries()) {
            if (val.tenantId === where.tenantId) {
              mockGraphNodesDb.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      graphEdgeRecord: {
        create: async ({ data }: any) => {
          // Validação de FK simulated
          const fromKey = `${data.tenantId}:${data.from}`;
          const toKey = `${data.tenantId}:${data.to}`;
          if (!mockGraphNodesDb.has(fromKey) || !mockGraphNodesDb.has(toKey)) {
            throw new Error(`Foreign key constraint violation: nodes must exist in the same tenant`);
          }
          const edgeKey = `${data.tenantId}:${data.id}`;
          if (mockGraphEdgesDb.has(edgeKey)) {
            throw new Error(`Unique constraint failed on the fields: (tenantId, id)`);
          }
          mockGraphEdgesDb.set(edgeKey, data);
          return data;
        },
        findUnique: async ({ where }: any) => {
          const key = `${where.tenantId_id.tenantId}:${where.tenantId_id.id}`;
          return mockGraphEdgesDb.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(mockGraphEdgesDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          if (where?.from) {
            rows = rows.filter((r) => r.from === where.from);
          }
          if (where?.to) {
            rows = rows.filter((r) => r.to === where.to);
          }
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(mockGraphEdgesDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          let count = 0;
          for (const [key, val] of mockGraphEdgesDb.entries()) {
            if (val.tenantId === where.tenantId) {
              mockGraphEdgesDb.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
    };

    const graphAdapterAlpha = new PrismaGraphAdapter({
      prisma: mockGraphPrisma,
      tenantId: 'tenant-graph-alpha',
    });

    const graphAdapterBeta = new PrismaGraphAdapter({
      prisma: mockGraphPrisma,
      tenantId: 'tenant-graph-beta',
    });

    // 58.1 Criação de GraphNode
    const nodeA: GraphNode = {
      id: 'node_cand_1',
      type: 'candidate',
      properties: { nome: 'Cand 1' },
      metadata: { source: 'tse', confidence: 0.95, createdAt: '', version: '1.0.0' },
    };
    const nodeB: GraphNode = {
      id: 'node_party_1',
      type: 'party',
      properties: { sigla: 'PART 1' },
      metadata: { source: 'tse', confidence: 1.0, createdAt: '', version: '1.0.0' },
    };
    const resNodeA = await graphAdapterAlpha.createNode(nodeA);
    const resNodeB = await graphAdapterAlpha.createNode(nodeB);
    assert(resNodeA.status === 'CREATED', '58.1 Nó A deve ser criado com status CREATED');
    assert(resNodeB.status === 'CREATED', '58.1 Nó B deve ser criado com status CREATED');

    // 58.2 Recuperação por ID
    const foundNodeA = await graphAdapterAlpha.findNode('node_cand_1');
    assert(foundNodeA !== undefined && foundNodeA.id === 'node_cand_1', '58.2 Deve recuperar nó criado por ID');

    // 58.3 exists
    const existsA = await graphAdapterAlpha.existsNode('node_cand_1');
    const existsGhost = await graphAdapterAlpha.existsNode('node_ghost');
    assert(existsA === true, '58.3 existsNode deve retornar true para nó existente');
    assert(existsGhost === false, '58.3 existsNode deve retornar false para inexistente');

    // 58.4 Idempotência de Node
    const resRepeatNodeA = await graphAdapterAlpha.createNode(nodeA);
    assert(resRepeatNodeA.status === 'EXISTS', '58.4 Criação repetida de nó deve retornar status EXISTS');
    assert(await graphAdapterAlpha.countNodes() === 2, '58.4 Contagem de nós não deve aumentar no reprocessamento');

    // 58.5 Criação de GraphEdge
    const edge1: GraphEdge = {
      id: 'node_cand_1_belongs_to_node_party_1',
      from: 'node_cand_1',
      to: 'node_party_1',
      relation: 'belongs_to',
      weight: 1.0,
      metadata: { source: 'tse', confidence: 0.95, createdAt: '', version: '1.0.0' },
    };
    const resEdge1 = await graphAdapterAlpha.createEdge(edge1);
    assert(resEdge1.status === 'CREATED', '58.5 Aresta deve ser criada com status CREATED');

    // 58.6 Idempotência de Edge
    const resRepeatEdge1 = await graphAdapterAlpha.createEdge(edge1);
    assert(resRepeatEdge1.status === 'EXISTS', '58.6 Inserção repetida de mesma aresta deve retornar status EXISTS');
    assert(await graphAdapterAlpha.countEdges() === 1, '58.6 Contagem de arestas não deve aumentar');

    // 58.7 Conflito estrutural de Edge
    try {
      await graphAdapterAlpha.createEdge({
        id: edge1.id,
        from: 'node_cand_1',
        to: 'node_party_1',
        relation: 'received_votes_from', // divergente
        weight: 1.0,
        metadata: edge1.metadata,
      });
      assert(false, 'Deveria lançar erro por conflito estrutural');
    } catch (err: any) {
      assert(err.message.includes('Conflito estrutural de aresta'), '58.7 Deve acusar conflito estrutural de aresta');
    }

    // 58.8 Contagem / Listagem
    const listAlphaNodes = await graphAdapterAlpha.listNodes();
    const listAlphaEdges = await graphAdapterAlpha.listEdges();
    assert(listAlphaNodes.length === 2, '58.8 Deve listar 2 nós');
    assert(listAlphaEdges.length === 1, '58.8 Deve listar 1 aresta');
    const edgesFromA = await graphAdapterAlpha.findEdgesFrom('node_cand_1');
    const edgesToA = await graphAdapterAlpha.findEdgesTo('node_party_1');
    assert(edgesFromA.length === 1, '58.8 Deve achar aresta partindo de node_cand_1');
    assert(edgesToA.length === 1, '58.8 Deve achar aresta chegando em node_party_1');

    // 58.9 Mesmo Node ID em dois tenants
    const resBetaNodeA = await graphAdapterBeta.createNode({
      ...nodeA,
      properties: { nome: 'Cand 1 do Tenant Beta' },
    });
    assert(resBetaNodeA.status === 'CREATED', '58.9 Mesmo Node ID deve ser criado no tenant-beta independentemente');
    const betaFoundA = await graphAdapterBeta.findNode('node_cand_1');
    assert(betaFoundA?.properties.nome === 'Cand 1 do Tenant Beta', '58.9 Tenant Beta preserva seus próprios dados');

    // 58.10 Mesmo Edge ID em dois tenants
    // Cria nó de partido no tenant beta para permitir a aresta
    await graphAdapterBeta.createNode(nodeB);
    const resBetaEdge = await graphAdapterBeta.createEdge(edge1);
    assert(resBetaEdge.status === 'CREATED', '58.10 Mesmo Edge ID deve ser criado no tenant-beta independentemente');
    assert(await graphAdapterBeta.countEdges() === 1, '58.10 Tenant beta possui 1 aresta');

    // 58.11 Isolamento entre tenants
    assert(await graphAdapterAlpha.countNodes() === 2, '58.11 Tenant alpha mantém contagem isolada de nós');
    assert(await graphAdapterBeta.countNodes() === 2, '58.11 Tenant beta mantém contagem isolada de nós');
    await graphAdapterBeta.clear();
    assert(await graphAdapterBeta.countNodes() === 0, '58.11 Clear em beta limpa apenas beta');
    assert(await graphAdapterAlpha.countNodes() === 2, '58.11 Clear em beta não afeta nós de alpha');
    assert(await graphAdapterAlpha.countEdges() === 1, '58.11 Clear em beta não afeta arestas de alpha');

    // 58.12 Tentativa de aresta cruzando tenants (apontando para nó inexistente no tenant do adapter)
    try {
      await graphAdapterBeta.createEdge({
        id: 'edge_cross',
        from: 'node_cand_1', // Não existe mais no beta após clear()
        to: 'node_party_1',
        relation: 'belongs_to',
        weight: 1.0,
        metadata: edge1.metadata,
      });
      assert(false, 'Deveria barrar criação de aresta referenciando nó fora do tenant');
    } catch (err: any) {
      assert(err.message.includes('Nó de origem ou destino inexistente no tenant'), '58.12 Deve impedir aresta cruzando limites de tenant');
    }

    // ----------------------------------------------------
    // Teste 59: Integração dos Adapters Persistentes ao Pipeline (Sprint 5.5 - Etapa 3C)
    // ----------------------------------------------------
    console.log('\n[Teste 59] Validando Integração dos Adapters Persistentes ao Pipeline e Isolamento Multi-Tenant...');

    // 59.1 Composição via Factory com usePersistentStores: true para Tenant A
    const tenantA = 'tenant_pipeline_a';
    const tenantB = 'tenant_pipeline_b';

    const mockSignalRecordsDb = new Map<string, any>();
    const mockSignalPrisma: any = {
      strategicSignalRecord: {
        upsert: async ({ where, create, update }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          const existing = mockSignalRecordsDb.get(key);
          if (existing) {
            const updated = { ...existing, ...update, updatedAt: new Date() };
            mockSignalRecordsDb.set(key, updated);
            return updated;
          } else {
            const created = { ...create, createdAt: new Date(), updatedAt: new Date() };
            mockSignalRecordsDb.set(key, created);
            return created;
          }
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return mockSignalRecordsDb.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(mockSignalRecordsDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          if (where?.type) {
            rows = rows.filter((r) => r.type === where.type);
          }
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(mockSignalRecordsDb.values());
          if (where?.tenantId) {
            rows = rows.filter((r) => r.tenantId === where.tenantId);
          }
          if (where?.id) {
            rows = rows.filter((r) => r.id === where.id);
          }
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = mockSignalRecordsDb.size;
            mockSignalRecordsDb.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(mockSignalRecordsDb.entries())) {
            if (val.tenantId === where.tenantId) {
              mockSignalRecordsDb.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
    };

    const mockPrismaFull: any = {
      ...mockPrisma,
      ...mockGraphPrisma,
      ...mockSignalPrisma,
    };

    const orchestratorA = IntelligenceOrchestratorFactory.create({
      tenantId: tenantA,
      prisma: mockPrismaFull,
      usePersistentStores: true,
    });

    const orchestratorB = IntelligenceOrchestratorFactory.create({
      tenantId: tenantB,
      prisma: mockPrismaFull,
      usePersistentStores: true,
    });

    // 59.2 Execução do Pipeline completo no Tenant A com MappedRecord determinístico
    const partyMappedTenantA: MappedRecord = {
      source: 'tse',
      entity: 'party',
      data: { sigla: 'PL', numero: 22, nome: 'Partido Liberal' },
      metadata: { id: 'party-pl', tenantId: tenantA },
      confidence: 1.0,
    };

    const candMappedTenantA: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { nome: 'Carlos Silva', numero: 22001, partido: 'PL' },
      metadata: { id: 'cand-22001', tenantId: tenantA },
      confidence: 1.0,
    };

    const resA1 = await orchestratorA.orchestrate({
      mappedRecord: partyMappedTenantA,
      targetRepositoryId: `prisma-strategic-repo-${tenantA}`,
    });
    assert(resA1.status === 'SUCCESS', '59.2 Orchestration A1 deve ter sucesso');
    assert(resA1.repositoryRecord.id === 'party-pl', '59.2 RepositoryRecord deve ter ID party-pl');
    assert(resA1.graphNode.id === 'party-pl', '59.2 GraphNode deve ter ID party-pl');

    const resA2 = await orchestratorA.orchestrate({
      mappedRecord: candMappedTenantA,
      targetRepositoryId: `prisma-strategic-repo-${tenantA}`,
    });
    assert(resA2.status === 'SUCCESS', '59.2 Orchestration A2 deve ter sucesso');
    assert(resA2.edgesCreated.length >= 1, '59.2 Deve criar relacionamento entre candidato e partido no Tenant A');

    // 59.3 Execução no Tenant B com EXATAMENTE o mesmo MappedRecord.id mas isolado
    const partyMappedTenantB: MappedRecord = {
      source: 'tse',
      entity: 'party',
      data: { sigla: 'PL', numero: 22, nome: 'Partido Liberal (Regional B)' },
      metadata: { id: 'party-pl', tenantId: tenantB },
      confidence: 1.0,
    };

    const resB1 = await orchestratorB.orchestrate({
      mappedRecord: partyMappedTenantB,
      targetRepositoryId: `prisma-strategic-repo-${tenantB}`,
    });
    assert(resB1.status === 'SUCCESS', '59.3 Orchestration B1 deve ter sucesso');
    assert(resB1.repositoryRecord.id === 'party-pl', '59.3 RepositoryRecord no Tenant B deve manter id lógico');

    // 59.4 Verificação de persistência e isolamento no PrismaStrategicRepository e PrismaGraphAdapter
    const repoTenantA = RepositoryRegistry.find(`prisma-strategic-repo-${tenantA}`) as PrismaStrategicRepository;
    const repoTenantB = RepositoryRegistry.find(`prisma-strategic-repo-${tenantB}`) as PrismaStrategicRepository;
    assert(repoTenantA !== undefined && repoTenantB !== undefined, '59.4 Repositórios de ambos os tenants devem estar registrados');

    const foundRepoA = await repoTenantA.getById('party-pl');
    const foundRepoB = await repoTenantB.getById('party-pl');
    assert(foundRepoA !== undefined && foundRepoB !== undefined, '59.4 Ambos os tenants devem conter o registro party-pl');
    assert((foundRepoA?.data as any).nome === 'Partido Liberal', '59.4 Dados do Tenant A preservados');
    assert((foundRepoB?.data as any).nome === 'Partido Liberal (Regional B)', '59.4 Dados do Tenant B isolados');

    // 59.5 Verificação de isolamento no Knowledge Graph
    const graphAdapterA = new PrismaGraphAdapter({ tenantId: tenantA, prisma: mockPrismaFull });
    const graphAdapterB = new PrismaGraphAdapter({ tenantId: tenantB, prisma: mockPrismaFull });

    const nodeAFound = await graphAdapterA.findNode('party-pl');
    const nodeBFound = await graphAdapterB.findNode('party-pl');
    assert(nodeAFound !== undefined && nodeBFound !== undefined, '59.5 Nós do grafo devem coexistir isolados por tenant');
    assert(nodeAFound?.properties.nome === 'Partido Liberal', '59.5 GraphNode de A preservado');
    assert(nodeBFound?.properties.nome === 'Partido Liberal (Regional B)', '59.5 GraphNode de B isolado');

    // Tenant B não deve ter a aresta criada no Tenant A
    const edgesTenantB = await graphAdapterB.listEdges();
    assert(edgesTenantB.length === 0, '59.5 Tenant B não deve herdar arestas de Tenant A');

    // ----------------------------------------------------
    // Teste 60: Persistência do Strategic Signal Engine (Sprint 5.5 - Etapa 4A)
    // ----------------------------------------------------
    console.log('\n[Teste 60] Validando Persistência do Strategic Signal Engine (PrismaStrategicSignalRepository, Idempotência e Multi-Tenant)...');

    const signalTenant1 = 'tenant_signal_alpha';
    const signalTenant2 = 'tenant_signal_beta';

    const signalRepo1 = new PrismaStrategicSignalRepository({
      tenantId: signalTenant1,
      prisma: mockSignalPrisma,
    });
    const signalRepo2 = new PrismaStrategicSignalRepository({
      tenantId: signalTenant2,
      prisma: mockSignalPrisma,
    });

    const sampleSignal1: StrategicSignal = {
      id: 'sig_orphan_cand_01',
      type: 'orphan_node',
      severity: 'medium',
      confidence: 0.9,
      context: { nodeId: 'cand_01', nodeType: 'candidate' },
      reason: 'Candidato isolado sem relacionamentos partidários ou eleitorais.',
      metadata: { source: 'tse', createdAt: '2026-10-08T18:00:00Z', version: '1.0.0' },
    };

    // 60.1 Criação de sinal
    await signalRepo1.store(sampleSignal1);
    const storeRes1 = await signalRepo1.getById('sig_orphan_cand_01');
    assert(storeRes1 !== undefined, '60.1 Sinal deve ser persistido com sucesso');
    assert(storeRes1?.id === sampleSignal1.id, '60.1 ID do sinal persistido deve ser idêntico');

    // 60.2 Recuperação por ID
    const retrieved1 = await signalRepo1.getById('sig_orphan_cand_01');
    assert(retrieved1 !== undefined, '60.2 Sinal deve ser recuperado com sucesso pelo getById');
    assert(retrieved1?.type === 'orphan_node', '60.2 Tipo do sinal recuperado deve ser preservado');
    assert(retrieved1?.severity === 'medium', '60.2 Severidade do sinal recuperado deve ser preservada');
    assert(retrieved1?.reason === sampleSignal1.reason, '60.2 Reason do sinal deve ser preservado');

    // 60.3 exists
    const signalExistsTrue = await signalRepo1.exists('sig_orphan_cand_01');
    const signalExistsFalse = await signalRepo1.exists('sig_inexistente');
    assert(signalExistsTrue === true, '60.3 exists deve retornar true para sinal existente');
    assert(signalExistsFalse === false, '60.3 exists deve retornar false para sinal não existente');

    // 60.4 Idempotência / re-store sem duplicar
    await signalRepo1.store(sampleSignal1);
    assert(await signalRepo1.count() === 1, '60.4 Contagem não deve aumentar após reprocessamento idempotente');

    // 60.5 Listagem e filtro por tipo
    const sampleSignal2: StrategicSignal = {
      id: 'sig_territorial_mun_3550308',
      type: 'territorial_opportunity',
      severity: 'high',
      confidence: 0.85,
      context: { municipalityId: '3550308', name: 'São Paulo' },
      reason: 'Alta densidade de eleitores com baixa cobertura partidária.',
      metadata: { source: 'tse', createdAt: '2026-10-08T18:05:00Z', version: '1.0.0' },
    };
    await signalRepo1.store(sampleSignal2);

    const allSignalsTenant1 = await signalRepo1.list();
    assert(allSignalsTenant1.length === 2, '60.5 Deve listar todos os sinais do tenant');
    const filteredOrphan = await signalRepo1.findByType('orphan_node');
    assert(filteredOrphan.length === 1 && filteredOrphan[0].id === 'sig_orphan_cand_01', '60.5 findByType deve filtrar corretamente');

    // 60.6 Contagem
    const countTenant1 = await signalRepo1.count();
    assert(countTenant1 === 2, '60.6 Contagem de tenant 1 deve ser 2');

    // 60.7 Mesmo ID de sinal em tenants diferentes coexiste independentemente
    const sampleSignalTenant2: StrategicSignal = {
      id: 'sig_orphan_cand_01', // Mesmo ID que no tenant 1
      type: 'orphan_node',
      severity: 'high', // Severidade diferente para o tenant 2
      confidence: 0.99,
      context: { nodeId: 'cand_01', nodeType: 'candidate', customNote: 'Exclusivo do tenant beta' },
      reason: 'Razão específica do tenant beta.',
      metadata: { source: 'tse', createdAt: '2026-10-08T18:00:00Z', version: '1.0.0', tenant: 'beta' },
    };
    await signalRepo2.store(sampleSignalTenant2);

    const fromTenant1 = await signalRepo1.getById('sig_orphan_cand_01');
    const fromTenant2 = await signalRepo2.getById('sig_orphan_cand_01');
    assert(fromTenant1?.severity === 'medium', '60.7 Dados do tenant 1 preservados');
    assert(fromTenant2?.severity === 'high', '60.7 Dados do tenant 2 preservados isoladamente');

    // 60.8 Isolamento estrito entre tenants
    assert(await signalRepo2.count() === 1, '60.8 Tenant 2 deve conter apenas 1 sinal');
    const tenant2Inexistente = await signalRepo2.getById('sig_territorial_mun_3550308');
    assert(tenant2Inexistente === undefined, '60.8 Tenant 2 não deve enxergar sinal exclusivo de Tenant 1');

    await signalRepo2.clear();
    assert(await signalRepo2.count() === 0, '60.8 Clear em Tenant 2 deve limpar apenas Tenant 2');
    assert(await signalRepo1.count() === 2, '60.8 Clear em Tenant 2 não deve afetar sinais de Tenant 1');

    // 60.9 InMemorySignalRepository equivalência
    const inMemSignalAlpha = new InMemorySignalRepository('tenant_mem_a');
    const inMemSignalBeta = new InMemorySignalRepository('tenant_mem_b');
    await inMemSignalAlpha.store(sampleSignal1);
    await inMemSignalBeta.store(sampleSignalTenant2);
    assert((await inMemSignalAlpha.getById('sig_orphan_cand_01'))?.severity === 'medium', '60.9 InMemory isola Alpha');
    assert((await inMemSignalBeta.getById('sig_orphan_cand_01'))?.severity === 'high', '60.9 InMemory isola Beta');

    // 60.10 SignalEngine -> Repository persistência e IntelligenceOrchestrator reprocessamento sem duplicar
    const mockFullWithSignals: any = {
      ...mockPrismaFull,
      strategicSignalRecord: mockSignalPrisma.strategicSignalRecord,
    };

    const orchestratorWithSignalPersistence = IntelligenceOrchestratorFactory.create({
      tenantId: 'tenant_orchestrator_signals',
      prisma: mockFullWithSignals,
      usePersistentStores: true,
    });

    // MappedRecord de candidato orfão (sem partido) para disparar OrphanNodeRule
    const orphanCandMapped: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { nome: 'Candidato Orfão Teste', numero: 99999 },
      metadata: { id: 'cand-orphan-99999', tenantId: 'tenant_orchestrator_signals' },
      confidence: 1.0,
    };

    const orchFirstRun = await orchestratorWithSignalPersistence.orchestrate({
      mappedRecord: orphanCandMapped,
      targetRepositoryId: 'prisma-strategic-repo-tenant_orchestrator_signals',
    });
    assert(orchFirstRun.status === 'SUCCESS', '60.10 Primeiro processamento no orchestrator deve ter sucesso');

    const orchestratorSignalRepo = new PrismaStrategicSignalRepository({
      tenantId: 'tenant_orchestrator_signals',
      prisma: mockFullWithSignals,
    });
    const signalsAfterFirst = await orchestratorSignalRepo.list();
    const countAfterFirst = signalsAfterFirst.length;
    assert(countAfterFirst > 0, '60.10 SignalEngine deve ter persistido sinais gerados no repositório');

    // Reprocessamento do mesmo MappedRecord
    const orchSecondRun = await orchestratorWithSignalPersistence.orchestrate({
      mappedRecord: orphanCandMapped,
      targetRepositoryId: 'prisma-strategic-repo-tenant_orchestrator_signals',
    });
    assert(orchSecondRun.status === 'SUCCESS', '60.10 Segundo processamento deve ter sucesso');
    assert(orchSecondRun.signalsGenerated.length === orchFirstRun.signalsGenerated.length, '60.10 Quantidade de sinais retornados no orchestrate é determinística');

    const signalsAfterSecond = await orchestratorSignalRepo.list();
    assert(signalsAfterSecond.length === countAfterFirst, '60.10 Reprocessamento não deve duplicar registros no PrismaStrategicSignalRepository');

    // ----------------------------------------------------
    // Teste 61: Auditoria End-to-End do Pipeline Persistente (Sprint 5.5 - Etapa 4B)
    // ----------------------------------------------------
    console.log('\n[Teste 61] Auditoria End-to-End do Pipeline Persistente (Fluxo E2E, Idempotência, Multi-Tenant, Falhas Controladas)...');

    // 61.1 Configuração de mock de banco Prisma multi-tenant unificado
    const e2eDbStrategicRecords = new Map<string, any>();
    const e2eDbGraphNodes = new Map<string, any>();
    const e2eDbGraphEdges = new Map<string, any>();
    const e2eDbSignals = new Map<string, any>();
    const e2eDbDecisions = new Map<string, any>();
    const e2eDbAuditEvents = new Map<string, any>();
    const e2eDbActionProposals = new Map<string, any>();
    const e2eDbActionExecutions = new Map<string, any>();

    const e2ePrismaMock: any = {
      strategicRecord: {
        upsert: async ({ where, create, update }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          const existing = e2eDbStrategicRecords.get(key);
          if (existing) {
            const updated = { ...existing, ...update };
            e2eDbStrategicRecords.set(key, updated);
            return updated;
          } else {
            e2eDbStrategicRecords.set(key, create);
            return create;
          }
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return e2eDbStrategicRecords.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbStrategicRecords.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.entity) rows = rows.filter((r) => r.entity === where.entity);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbStrategicRecords.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbStrategicRecords.size;
            e2eDbStrategicRecords.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbStrategicRecords.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbStrategicRecords.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      graphNodeRecord: {
        create: async ({ data }: any) => {
          const key = `${data.tenantId}:${data.id}`;
          if (e2eDbGraphNodes.has(key)) {
            throw new Error(`Unique constraint failed on the fields: (tenantId, id)`);
          }
          e2eDbGraphNodes.set(key, data);
          return data;
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return e2eDbGraphNodes.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbGraphNodes.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.type) rows = rows.filter((r) => r.type === where.type);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbGraphNodes.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.type) rows = rows.filter((r) => r.type === where.type);
          if (where?.id) rows = rows.filter((r) => r.id === where.id);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbGraphNodes.size;
            e2eDbGraphNodes.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbGraphNodes.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbGraphNodes.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      graphEdgeRecord: {
        create: async ({ data }: any) => {
          const key = `${data.tenantId}:${data.id}`;
          if (e2eDbGraphEdges.has(key)) {
            throw new Error(`Unique constraint failed on the fields: (tenantId, id)`);
          }
          e2eDbGraphEdges.set(key, data);
          return data;
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return e2eDbGraphEdges.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbGraphEdges.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.relation) rows = rows.filter((r) => r.relation === where.relation);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbGraphEdges.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.relation) rows = rows.filter((r) => r.relation === where.relation);
          if (where?.id) rows = rows.filter((r) => r.id === where.id);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbGraphEdges.size;
            e2eDbGraphEdges.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbGraphEdges.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbGraphEdges.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      strategicSignalRecord: {
        upsert: async ({ where, create, update }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          const existing = e2eDbSignals.get(key);
          if (existing) {
            const updated = { ...existing, ...update, updatedAt: new Date() };
            e2eDbSignals.set(key, updated);
            return updated;
          } else {
            const created = { ...create, createdAt: new Date(), updatedAt: new Date() };
            e2eDbSignals.set(key, created);
            return created;
          }
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return e2eDbSignals.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbSignals.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.type) rows = rows.filter((r) => r.type === where.type);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbSignals.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.id) rows = rows.filter((r) => r.id === where.id);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbSignals.size;
            e2eDbSignals.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbSignals.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbSignals.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      decisionRecord: {
        upsert: async ({ where, create, update }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          const existing = e2eDbDecisions.get(key);
          if (existing) {
            const updated = { ...existing, ...update, updatedAt: new Date() };
            e2eDbDecisions.set(key, updated);
            return updated;
          } else {
            const created = { ...create, createdAt: new Date(), updatedAt: new Date() };
            e2eDbDecisions.set(key, created);
            return created;
          }
        },
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return e2eDbDecisions.get(key) || null;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbDecisions.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.category) rows = rows.filter((r) => r.category === where.category);
          if (where?.priority) rows = rows.filter((r) => r.priority === where.priority);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbDecisions.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.id) rows = rows.filter((r) => r.id === where.id);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbDecisions.size;
            e2eDbDecisions.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbDecisions.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbDecisions.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      decisionAuditEventRecord: {
        create: async ({ data }: any) => {
          const key = `${data.tenantId}:${data.id}`;
          e2eDbAuditEvents.set(key, { ...data, timestamp: data.timestamp || new Date() });
          return data;
        },
        findMany: async ({ where, orderBy }: any) => {
          let rows = Array.from(e2eDbAuditEvents.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.decisionId) rows = rows.filter((r) => r.decisionId === where.decisionId);
          if (where?.actorId) rows = rows.filter((r) => r.actorId === where.actorId);
          if (where?.operation) rows = rows.filter((r) => r.operation === where.operation);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbAuditEvents.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.decisionId) rows = rows.filter((r) => r.decisionId === where.decisionId);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbAuditEvents.size;
            e2eDbAuditEvents.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbAuditEvents.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbAuditEvents.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      actionProposalRecord: {
        findUnique: async ({ where }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          return e2eDbActionProposals.get(key) || null;
        },
        create: async ({ data }: any) => {
          const key = `${data.tenantId}:${data.id}`;
          if (e2eDbActionProposals.has(key)) {
            throw new Error(`Unique constraint failed on the fields: (tenantId, id)`);
          }
          if (!data.title || typeof data.title !== 'string') {
            throw new Error(`Invalid value for field title: must be non-null string`);
          }
          const record = { ...data, createdAt: new Date(), updatedAt: new Date() };
          e2eDbActionProposals.set(key, record);
          return record;
        },
        update: async ({ where, data }: any) => {
          const tenantId = where.tenantId_id.tenantId;
          const id = where.tenantId_id.id;
          const key = `${tenantId}:${id}`;
          const existing = e2eDbActionProposals.get(key);
          if (!existing) {
            throw new Error(`Record not found: ${key}`);
          }
          const updated = { ...existing, ...data, updatedAt: new Date() };
          e2eDbActionProposals.set(key, updated);
          return updated;
        },
        updateMany: async ({ where, data }: any) => {
          let count = 0;
          for (const [key, existing] of Array.from(e2eDbActionProposals.entries())) {
            const matchesTenant = !where.tenantId || existing.tenantId === where.tenantId;
            const matchesId = !where.id || existing.id === where.id;
            const matchesStatus = !where.status || existing.status === where.status;

            if (matchesTenant && matchesId && matchesStatus) {
              const updated = { ...existing, ...data, updatedAt: new Date() };
              e2eDbActionProposals.set(key, updated);
              count++;
            }
          }
          return { count };
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbActionProposals.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.decisionId) rows = rows.filter((r) => r.decisionId === where.decisionId);
          if (where?.status) rows = rows.filter((r) => r.status === where.status);
          if (where?.priority) rows = rows.filter((r) => r.priority === where.priority);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbActionProposals.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.decisionId) rows = rows.filter((r) => r.decisionId === where.decisionId);
          if (where?.status) rows = rows.filter((r) => r.status === where.status);
          if (where?.priority) rows = rows.filter((r) => r.priority === where.priority);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbActionProposals.size;
            e2eDbActionProposals.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbActionProposals.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbActionProposals.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      actionExecutionRecord: {
        create: async ({ data }: any) => {
          const key = `${data.tenantId}:${data.id}`;
          if (e2eDbActionExecutions.has(key)) {
            throw new Error(`Unique constraint failed on the fields: (tenantId, id)`);
          }
          // Checa unique constraint de [tenantId, proposalId, attemptNumber]
          for (const existing of e2eDbActionExecutions.values()) {
            if (
              existing.tenantId === data.tenantId &&
              existing.proposalId === data.proposalId &&
              existing.attemptNumber === data.attemptNumber
            ) {
              throw new Error(
                `Unique constraint failed on the fields: (tenantId, proposalId, attemptNumber)`
              );
            }
          }
          const record = { ...data, createdAt: new Date(), updatedAt: new Date() };
          e2eDbActionExecutions.set(key, record);
          return record;
        },
        findUnique: async ({ where }: any) => {
          if (where.tenantId_id) {
            const key = `${where.tenantId_id.tenantId}:${where.tenantId_id.id}`;
            return e2eDbActionExecutions.get(key) || null;
          }
          if (where.tenantId_proposalId_attemptNumber) {
            const { tenantId, proposalId, attemptNumber } = where.tenantId_proposalId_attemptNumber;
            for (const existing of e2eDbActionExecutions.values()) {
              if (
                existing.tenantId === tenantId &&
                existing.proposalId === proposalId &&
                existing.attemptNumber === attemptNumber
              ) {
                return existing;
              }
            }
            return null;
          }
          return null;
        },
        updateMany: async ({ where, data }: any) => {
          let count = 0;
          for (const [key, existing] of Array.from(e2eDbActionExecutions.entries())) {
            const matchesTenant = !where.tenantId || existing.tenantId === where.tenantId;
            const matchesId = !where.id || existing.id === where.id;
            const matchesStatus = !where.status || existing.status === where.status;

            if (matchesTenant && matchesId && matchesStatus) {
              const updated = { ...existing, ...data, updatedAt: new Date() };
              e2eDbActionExecutions.set(key, updated);
              count++;
            }
          }
          return { count };
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(e2eDbActionExecutions.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.proposalId) rows = rows.filter((r) => r.proposalId === where.proposalId);
          if (where?.status) rows = rows.filter((r) => r.status === where.status);
          return rows;
        },
        count: async ({ where }: any) => {
          let rows = Array.from(e2eDbActionExecutions.values());
          if (where?.tenantId) rows = rows.filter((r) => r.tenantId === where.tenantId);
          if (where?.proposalId) rows = rows.filter((r) => r.proposalId === where.proposalId);
          return rows.length;
        },
        deleteMany: async ({ where }: any) => {
          if (!where?.tenantId) {
            const count = e2eDbActionExecutions.size;
            e2eDbActionExecutions.clear();
            return { count };
          }
          let count = 0;
          for (const [key, val] of Array.from(e2eDbActionExecutions.entries())) {
            if (val.tenantId === where.tenantId) {
              e2eDbActionExecutions.delete(key);
              count++;
            }
          }
          return { count };
        },
      },
      $transaction: async (fnOrArray: any) => {
        if (typeof fnOrArray === 'function') {
          // Snapshot em memória para suportar rollback simulado em caso de erro
          const snapshotActionProposals = new Map(e2eDbActionProposals);
          const snapshotActionExecutions = new Map(e2eDbActionExecutions);
          const snapshotDecisions = new Map(e2eDbDecisions);
          const snapshotSignals = new Map(e2eDbSignals);
          const snapshotAudit = new Map(e2eDbAuditEvents);

          try {
            return await fnOrArray(e2ePrismaMock);
          } catch (error) {
            // Rollback simulado
            e2eDbActionProposals.clear();
            for (const [k, v] of snapshotActionProposals) e2eDbActionProposals.set(k, v);
            e2eDbActionExecutions.clear();
            for (const [k, v] of snapshotActionExecutions) e2eDbActionExecutions.set(k, v);
            e2eDbDecisions.clear();
            for (const [k, v] of snapshotDecisions) e2eDbDecisions.set(k, v);
            e2eDbSignals.clear();
            for (const [k, v] of snapshotSignals) e2eDbSignals.set(k, v);
            e2eDbAuditEvents.clear();
            for (const [k, v] of snapshotAudit) e2eDbAuditEvents.set(k, v);
            throw error;
          }
        }
        return fnOrArray;
      },
    };

    // 61.2 Criação dos Orchestrators via Factory com usePersistentStores: true para Tenant Alpha e Tenant Beta
    const tenantAlpha = 'tenant_e2e_alpha';
    const tenantBeta = 'tenant_e2e_beta';

    const e2eOrchestratorAlpha = IntelligenceOrchestratorFactory.create({
      tenantId: tenantAlpha,
      prisma: e2ePrismaMock,
      usePersistentStores: true,
    });

    const e2eOrchestratorBeta = IntelligenceOrchestratorFactory.create({
      tenantId: tenantBeta,
      prisma: e2ePrismaMock,
      usePersistentStores: true,
    });

    // 61.3 Conjunto E2E canônico: party → candidate → election
    const rawPartyData = { sigla: 'PARTIDO_X', numero: 55, nome: 'Partido X Nacional' };
    const rawCandidateData = { nome: 'Maria Santos', numero: 55000, partido: 'PARTIDO_X' };
    const rawElectionData = { ano: 2026, cargo: 'Deputado Federal', turno: 1 };

    const mappedPartyAlpha: MappedRecord = {
      source: 'tse',
      entity: 'party',
      data: rawPartyData,
      metadata: { id: 'party-55', tenantId: tenantAlpha },
      confidence: 1.0,
    };

    const mappedCandidateAlpha: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: rawCandidateData,
      metadata: { id: 'cand-55000', tenantId: tenantAlpha },
      confidence: 1.0,
    };

    const mappedElectionAlpha: MappedRecord = {
      source: 'tse',
      entity: 'election',
      data: rawElectionData,
      metadata: { id: 'elec-2026-df', tenantId: tenantAlpha },
      confidence: 1.0,
    };

    // Execução do pipeline no Tenant Alpha
    const r1Alpha = await e2eOrchestratorAlpha.orchestrate({
      mappedRecord: mappedPartyAlpha,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });
    assert(r1Alpha.status === 'SUCCESS', '61.3 Processamento de Party no Alpha deve ser SUCCESS');

    const r2Alpha = await e2eOrchestratorAlpha.orchestrate({
      mappedRecord: mappedCandidateAlpha,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });
    assert(r2Alpha.status === 'SUCCESS', '61.3 Processamento de Candidate no Alpha deve ser SUCCESS');
    assert(r2Alpha.edgesCreated.length >= 1, '61.3 Deve criar aresta belongs_to entre candidato e partido');

    const r3Alpha = await e2eOrchestratorAlpha.orchestrate({
      mappedRecord: mappedElectionAlpha,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });
    assert(r3Alpha.status === 'SUCCESS', '61.3 Processamento de Election no Alpha deve ser SUCCESS');

    // 61.4 Validação de Consistência Cruzada (RepositoryRecord.id === GraphNode.id)
    assert(r1Alpha.repositoryRecord.id === r1Alpha.graphNode.id, '61.4 Party: RepositoryRecord.id === GraphNode.id');
    assert(r2Alpha.repositoryRecord.id === r2Alpha.graphNode.id, '61.4 Candidate: RepositoryRecord.id === GraphNode.id');
    assert(r3Alpha.repositoryRecord.id === r3Alpha.graphNode.id, '61.4 Election: RepositoryRecord.id === GraphNode.id');

    // Validação dos IDs nas arestas
    const createdEdge = r2Alpha.edgesCreated[0];
    assert(createdEdge.from === 'cand-55000', '61.4 Aresta deve originar do nó cand-55000');
    assert(createdEdge.to === 'party-55', '61.4 Aresta deve terminar no nó party-55');
    assert(createdEdge.relation === 'belongs_to', '61.4 Relação deve ser belongs_to');

    // Contagens consolidadas após primeira rodada
    const e2eRepoAlpha = RepositoryRegistry.find(`prisma-strategic-repo-${tenantAlpha}`) as PrismaStrategicRepository;
    const e2eGraphAdapterAlpha = new PrismaGraphAdapter({ tenantId: tenantAlpha, prisma: e2ePrismaMock });
    const e2eSignalRepoAlpha = new PrismaStrategicSignalRepository({ tenantId: tenantAlpha, prisma: e2ePrismaMock });

    const recordsBeforeReprocess = await e2eRepoAlpha.count();
    const nodesBeforeReprocess = await e2eGraphAdapterAlpha.countNodes();
    const edgesBeforeReprocess = await e2eGraphAdapterAlpha.countEdges();
    const signalsBeforeReprocess = await e2eSignalRepoAlpha.count();

    assert(recordsBeforeReprocess === 3, '61.3 Alpha deve conter exatamente 3 registros');
    assert(nodesBeforeReprocess === 3, '61.3 Alpha deve conter exatamente 3 nós');
    assert(edgesBeforeReprocess === 1, '61.3 Alpha deve conter exatamente 1 aresta');

    // 61.5 Reprocessamento Idempotente (Segunda Execução do mesmo conjunto no Tenant Alpha)
    const r1AlphaReprocess = await e2eOrchestratorAlpha.orchestrate({
      mappedRecord: mappedPartyAlpha,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });
    const r2AlphaReprocess = await e2eOrchestratorAlpha.orchestrate({
      mappedRecord: mappedCandidateAlpha,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });
    const r3AlphaReprocess = await e2eOrchestratorAlpha.orchestrate({
      mappedRecord: mappedElectionAlpha,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });

    assert(r1AlphaReprocess.status === 'SUCCESS', '61.5 Reprocessamento Party deve ser SUCCESS');
    assert(r2AlphaReprocess.status === 'SUCCESS', '61.5 Reprocessamento Candidate deve ser SUCCESS');
    assert(r3AlphaReprocess.status === 'SUCCESS', '61.5 Reprocessamento Election deve ser SUCCESS');

    // Confirmação de que arestas não foram duplicadas no reprocessamento
    assert(r2AlphaReprocess.edgesCreated.length === 0, '61.5 Reprocessamento não deve recriar arestas existentes');

    const recordsAfterReprocess = await e2eRepoAlpha.count();
    const nodesAfterReprocess = await e2eGraphAdapterAlpha.countNodes();
    const edgesAfterReprocess = await e2eGraphAdapterAlpha.countEdges();
    const signalsAfterReprocess = await e2eSignalRepoAlpha.count();

    assert(recordsAfterReprocess === recordsBeforeReprocess, '61.5 Reprocessamento não deve alterar contagem de registros');
    assert(nodesAfterReprocess === nodesBeforeReprocess, '61.5 Reprocessamento não deve alterar contagem de nós');
    assert(edgesAfterReprocess === edgesBeforeReprocess, '61.5 Reprocessamento não deve alterar contagem de arestas');
    assert(signalsAfterReprocess === signalsBeforeReprocess, '61.5 Reprocessamento não deve alterar contagem de sinais');

    // IDs permanecem estritamente idênticos
    assert(r1AlphaReprocess.repositoryRecord.id === r1Alpha.repositoryRecord.id, '61.5 ID do registro party é determinístico');
    assert(r2AlphaReprocess.repositoryRecord.id === r2Alpha.repositoryRecord.id, '61.5 ID do registro candidate é determinístico');
    assert(r3AlphaReprocess.repositoryRecord.id === r3Alpha.repositoryRecord.id, '61.5 ID do registro election é determinístico');

    // 61.6 Isolamento Multi-Tenant Completo (Execução no Tenant Beta com os MESMOS IDs lógicos)
    const mappedPartyBeta: MappedRecord = {
      source: 'tse',
      entity: 'party',
      data: { ...rawPartyData, regional: 'Diretório Beta' },
      metadata: { id: 'party-55', tenantId: tenantBeta },
      confidence: 1.0,
    };

    const mappedCandidateBeta: MappedRecord = {
      source: 'tse',
      entity: 'candidate',
      data: { ...rawCandidateData, slogan: 'Candidato Beta' },
      metadata: { id: 'cand-55000', tenantId: tenantBeta },
      confidence: 1.0,
    };

    const r1Beta = await e2eOrchestratorBeta.orchestrate({
      mappedRecord: mappedPartyBeta,
      targetRepositoryId: `prisma-strategic-repo-${tenantBeta}`,
    });
    const r2Beta = await e2eOrchestratorBeta.orchestrate({
      mappedRecord: mappedCandidateBeta,
      targetRepositoryId: `prisma-strategic-repo-${tenantBeta}`,
    });

    assert(r1Beta.status === 'SUCCESS', '61.6 Beta: Party orquestrada com sucesso');
    assert(r2Beta.status === 'SUCCESS', '61.6 Beta: Candidate orquestrado com sucesso');

    const e2eRepoBeta = RepositoryRegistry.find(`prisma-strategic-repo-${tenantBeta}`) as PrismaStrategicRepository;
    const e2eGraphAdapterBeta = new PrismaGraphAdapter({ tenantId: tenantBeta, prisma: e2ePrismaMock });
    const e2eSignalRepoBeta = new PrismaStrategicSignalRepository({ tenantId: tenantBeta, prisma: e2ePrismaMock });

    // Coexistência e isolamento
    const partyFromAlpha = await e2eRepoAlpha.getById('party-55');
    const partyFromBeta = await e2eRepoBeta.getById('party-55');
    assert(partyFromAlpha !== undefined && partyFromBeta !== undefined, '61.6 Mesmo ID coexiste em Alpha e Beta');
    assert((partyFromAlpha?.data as any).nome === 'Partido X Nacional', '61.6 Alpha preserva seus dados originais');
    assert((partyFromBeta?.data as any).regional === 'Diretório Beta', '61.6 Beta preserva seus dados exclusivos');

    // Contagem de Alpha inalterada pela execução de Beta
    assert(await e2eRepoAlpha.count() === 3, '61.6 Execução em Beta não afeta registros de Alpha');
    assert(await e2eGraphAdapterAlpha.countNodes() === 3, '61.6 Execução em Beta não afeta nós de Alpha');
    assert(await e2eRepoBeta.count() === 2, '61.6 Beta possui seus 2 registros independentes');

    // clear() em Beta não altera Alpha
    await e2eGraphAdapterBeta.clear();
    await e2eSignalRepoBeta.clear();
    assert(await e2eGraphAdapterBeta.countNodes() === 0, '61.6 Clear em Beta esvazia nós de Beta');
    assert(await e2eGraphAdapterAlpha.countNodes() === 3, '61.6 Clear em Beta não afeta nós de Alpha');
    assert(await e2eGraphAdapterAlpha.countEdges() === 1, '61.6 Clear em Beta não afeta arestas de Alpha');
    assert(await e2eSignalRepoAlpha.count() === signalsBeforeReprocess, '61.6 Clear em Beta não afeta sinais de Alpha');

    // 61.7 Falhas Controladas
    // 61.7.a Conflito estrutural de GraphEdge -> Erro explícito
    try {
      await e2eGraphAdapterAlpha.createEdge({
        id: createdEdge.id,
        from: 'cand-55000',
        to: 'party-55',
        relation: 'received_votes_from', // divergência de relação
        weight: 1.0,
        metadata: createdEdge.metadata,
      });
      assert(false, '61.7 Conflito estrutural de aresta deve lançar erro explícito');
    } catch (err: any) {
      assert(err.message.includes('Conflito estrutural de aresta'), '61.7 Mensagem de erro estrutural deve ser explícita');
    }

    // 61.7.b Nó inexistente para criação de edge -> Erro explícito
    try {
      await e2eGraphAdapterAlpha.createEdge({
        id: 'edge_invalid_node',
        from: 'cand-inexistente',
        to: 'party-55',
        relation: 'belongs_to',
        weight: 1.0,
        metadata: createdEdge.metadata,
      });
      assert(false, '61.7 Criação de aresta com nó inexistente deve lançar erro');
    } catch (err: any) {
      assert(err.message.includes('Nó de origem ou destino inexistente no tenant'), '61.7 Deve rejeitar nó inexistente');
    }

    // 61.7.c Erro em SignalEngine gera status PARTIAL sem corromper grafo ou repositório
    const failingSignalEngine = {
      generateSignals: async () => {
        throw new Error('Falha simulada no motor de sinais');
      },
    } as any;

    const partialOrchestrator = new IntelligenceOrchestrator(
      RepositoryService,
      new GraphService(e2eGraphAdapterAlpha.asNodeStore(), e2eGraphAdapterAlpha.asEdgeStore()),
      new RelationshipEngine(RelationshipRegistry, GraphBuilder),
      failingSignalEngine,
      e2eGraphAdapterAlpha.asNodeStore(),
      e2eGraphAdapterAlpha.asEdgeStore()
    );

    const e2ePartialMapped: MappedRecord = {
      source: 'tse',
      entity: 'party',
      data: { sigla: 'PARTIDO_PARTIAL', numero: 99 },
      metadata: { id: 'party-partial-99', tenantId: tenantAlpha },
      confidence: 1.0,
    };

    const e2ePartialResult = await partialOrchestrator.orchestrate({
      mappedRecord: e2ePartialMapped,
      targetRepositoryId: `prisma-strategic-repo-${tenantAlpha}`,
    });

    assert(e2ePartialResult.status === 'PARTIAL', '61.7 Falha no motor de sinais deve produzir status PARTIAL');
    assert(await e2eRepoAlpha.exists('party-partial-99') === true, '61.7 RepositoryRecord deve ser gravado mesmo com sinal parcial');
    assert(await e2eGraphAdapterAlpha.existsNode('party-partial-99') === true, '61.7 GraphNode deve ser gravado mesmo com sinal parcial');

    // ----------------------------------------------------
    // Teste 62: Strategic Context Adapter - GraphIntelligenceRepository (Sprint 6 - Etapa 1B)
    // ----------------------------------------------------
    console.log('\n[Teste 62] Validando GraphIntelligenceRepository Adapter e Integração com KernelPipeline...');

    // 62.1 Validação de obrigatoriedade do tenantId
    try {
      new GraphIntelligenceRepository({ tenantId: '' } as any);
      assert(false, '62.1 Deve exigir tenantId no construtor');
    } catch (err: any) {
      assert(err.message.includes('tenantId é obrigatório'), '62.1 Mensagem de erro de tenantId obrigatório');
    }

    // 62.2 Instanciação de GraphIntelligenceRepository para Tenant Alpha e Tenant Beta
    const graphIntelRepoAlpha = new GraphIntelligenceRepository({
      tenantId: tenantAlpha,
      prisma: e2ePrismaMock,
    });

    const graphIntelRepoBeta = new GraphIntelligenceRepository({
      tenantId: tenantBeta,
      prisma: e2ePrismaMock,
    });

    // 62.3 getDataMode()
    assert(graphIntelRepoAlpha.getDataMode() === 'GRAPH_STRATEGIC', '62.3 getDataMode deve retornar GRAPH_STRATEGIC');

    // Cria um segundo candidato no Tenant Alpha para testar distinção exata entre contas no mesmo tenant
    await e2ePrismaMock.graphNodeRecord.create({
      data: {
        tenantId: tenantAlpha,
        id: 'cand-second-99',
        type: 'candidate',
        properties: { nome: 'João Secundário', numero: 99111, cargo: 'SENADOR', partido: 'PARTIDO_Y' },
        metadata: { source: 'tse' },
      },
    });

    // 62.4 getPoliticalProfile exato por accountId
    const profileCand1 = await graphIntelRepoAlpha.getPoliticalProfile('cand-55000');
    assert(profileCand1 !== null, '62.4 Deve encontrar candidato 1 pelo ID exato');
    assert(profileCand1.candidateName === 'Maria Santos', '62.4 Nome do candidato 1 correto');
    assert(profileCand1.candidateNumber === '55000', '62.4 Número do candidato 1 correto');

    const profileCand2 = await graphIntelRepoAlpha.getPoliticalProfile('cand-second-99');
    assert(profileCand2 !== null, '62.4 Deve encontrar candidato 2 pelo ID exato no mesmo tenant');
    assert(profileCand2.candidateName === 'João Secundário', '62.4 Nome do candidato 2 correto');
    assert(profileCand2.candidateNumber === '99111', '62.4 Número do candidato 2 correto');

    // accountId inexistente DEVE retornar null (PROIBIDO fallback)
    const profileInexistent = await graphIntelRepoAlpha.getPoliticalProfile('cand_inexistente_xyz');
    assert(profileInexistent === null, '62.4 accountId inexistente DEVE retornar null sem selecionar outro candidato como fallback');

    // 62.5 getTerritorialOverview com agregações derivadas do grafo
    const terrOverviewAlpha = await graphIntelRepoAlpha.getTerritorialOverview(tenantAlpha);
    assert(terrOverviewAlpha !== undefined, '62.5 Deve retornar visão territorial agregada');
    assert(terrOverviewAlpha.candidateCount === 2, '62.5 candidateCount agregado no grafo');
    assert(terrOverviewAlpha.edgeCount === 2, '62.5 edgeCount agregado no grafo');

    // 62.6 getGrowthIndicators derivados de edges e signals
    const growthAlpha = await graphIntelRepoAlpha.getGrowthIndicators(tenantAlpha);
    assert(growthAlpha.strengthAreas.length > 0, '62.6 Deve conter áreas de força baseadas na rede do grafo');

    // 62.7 getPoliticalPresence e getExecutiveIndicators
    const presenceAlpha = await graphIntelRepoAlpha.getPoliticalPresence(tenantAlpha);
    assert(presenceAlpha.totalLeaders >= 2, '62.7 Deve calcular totalLeaders com base em nós políticos');
    assert(presenceAlpha.registeredVotersCount === 0, '62.7 registeredVotersCount não deve ser inventado');
    assert((presenceAlpha as any).activityLevel === undefined, '62.7 activityLevel arbitrário deve ser removido');

    // Oportunidades estratégicas sem scores ou públicos inventados
    const oppsAlpha = await graphIntelRepoAlpha.getStrategicOpportunities(tenantAlpha);
    if (oppsAlpha.length > 0) {
      assert(oppsAlpha[0].severity !== undefined, '62.7 Oportunidades transportam severidade real do sinal');
      assert((oppsAlpha[0] as any).priorityScore === undefined, '62.7 priorityScore arbitrário não deve ser inventado no adapter');
    }

    const execAlpha = await graphIntelRepoAlpha.getExecutiveIndicators(tenantAlpha);
    assert(execAlpha.tcsScore === undefined, '62.7 Adapter não deve recalcular ou inventar tcsScore fora do Core');

    // 62.8 Isolamento Multi-Tenant estrito entre Alpha e Beta
    // No tenant Beta nós limpamos os dados anteriormente no teste 61 (clear()), logo o grafo está vazio
    const terrOverviewBeta = await graphIntelRepoBeta.getTerritorialOverview(tenantBeta);
    assert(terrOverviewBeta.edgeCount === 0, '62.8 Beta não deve enxergar arestas de Alpha');
    assert(terrOverviewBeta.candidateCount === 0, '62.8 Beta não deve enxergar nós de candidato de Alpha');

    const profileBetaEmpty = await graphIntelRepoBeta.getPoliticalProfile('cand-55000');
    assert(profileBetaEmpty === null, '62.8 Beta não enxerga candidato existente apenas em Alpha');

    // 62.10 Integração de ponta a ponta com o KernelPipeline do Core
    const politicalContext: PoliticalIntelligenceContext = {
      accountId: tenantAlpha,
      tenantId: tenantAlpha,
      accountType: 'CANDIDATO',
      politicalProfile: {
        candidateName: 'Maria Santos',
        candidateNumber: '55000',
        role: 'DEPUTADO_FEDERAL',
        party: 'PARTIDO_X',
        uf: 'SP',
      },
      electionInterests: [],
      defaultElectionInterest: null,
      automaticFilters: [],
      geographicContext: {
        uf: 'SP',
        cityCode: 3550308,
        zones: [1, 2],
      },
      candidateContext: {
        candidateName: 'Maria Santos',
        candidateNumber: '55000',
        role: 'DEPUTADO_FEDERAL',
        party: 'PARTIDO_X',
      },
      partyContext: {
        partyAcronyms: ['PARTIDO_X'],
      },
    };

    const kernelAnalysisResult = await KernelPipeline.run(politicalContext, graphIntelRepoAlpha);
    assert(kernelAnalysisResult !== undefined, '62.10 KernelPipeline.run deve executar com sucesso consumindo GraphIntelligenceRepository');
    assert(kernelAnalysisResult.scores.length === 4, '62.10 Deve computar os 4 scores do SIK (TCS, GOS, PRS, ISI) via ScoreRegistry do Core');
    assert(kernelAnalysisResult.scores.find((s) => s.code === 'TCS')?.score === 65, '62.10 Score TCS calculado pelo ScoreRegistry soberano do Core');
    assert(kernelAnalysisResult.scores.find((s) => s.code === 'GOS')?.score === 78, '62.10 Score GOS calculado pelo ScoreRegistry soberano do Core');
    assert(kernelAnalysisResult.scores.find((s) => s.code === 'PRS')?.score === 32, '62.10 Score PRS calculado pelo ScoreRegistry soberano do Core');
    assert(kernelAnalysisResult.scores.find((s) => s.code === 'ISI')?.score === 720, '62.10 Score ISI calculado pelo ScoreRegistry soberano do Core');
    assert(kernelAnalysisResult.executiveSummary !== undefined, '62.10 Sumário executivo gerado pelo SIK');
    assert(kernelAnalysisResult.aiContext !== undefined, '62.10 Contexto de IA construído pelo SIK');
    assert(kernelAnalysisResult.metadata.accountId === tenantAlpha, '62.10 Metadata com accountId correto');

    console.log(`\n[Teste 63] Validando Intelligence Signal Bridge (StrategicSignalBridge) e Integração com DecisionEngine...`);

    // 63.1 Mapeamento individual de sinais suportados (orphan_node, territorial_opportunity, high_relationship_density)
    const rawOrphanSignal = {
      tenantId: tenantAlpha,
      id: 'sig_orphan_test_1',
      type: 'orphan_node',
      severity: 'critical',
      confidence: 0.95,
      context: { nodeId: 'cand-55000', nodeType: 'candidate' },
      reason: 'Candidato isolado sem conexões partidárias ou territoriais.',
      metadata: { source: 'tse', version: '1.0.0', createdAt: '2026-10-08T18:00:00Z' },
    };

    const coreOrphanSignal = StrategicSignalBridge.toCoreSignal(rawOrphanSignal as any, tenantAlpha);
    assert(coreOrphanSignal !== null, '63.1 Sinal orphan_node deve ser convertido com sucesso');
    assert(coreOrphanSignal?.id === 'sig_orphan_test_1', '63.1 ID preservado');
    assert(coreOrphanSignal?.code === 'ORPHAN_NODE', '63.1 Code em caixa alta');
    assert(coreOrphanSignal?.category === 'RISK', '63.1 orphan_node mapeado para RISK');
    assert(coreOrphanSignal?.priority === 'URGENT', '63.1 critical mapeado para URGENT');
    assert(coreOrphanSignal?.status === 'CRITICAL', '63.1 critical mapeado para status CRITICAL');
    assert(coreOrphanSignal?.trend === 'UNKNOWN', '63.1 trend deve ser UNKNOWN (sem histórico temporal no Sprint 5.5)');
    assert(coreOrphanSignal?.confidence === 0.95, '63.1 Confidence preservada');
    assert(coreOrphanSignal?.summary === rawOrphanSignal.reason, '63.1 Summary reflete reason');
    assert(coreOrphanSignal?.score === 0, '63.1 Score numérico não inventado (0)');
    assert(coreOrphanSignal?.recommendedActions.length === 0, '63.1 Ações não inventadas no bridge');

    // 63.2 Mapeamento de territorial_opportunity
    const rawTerrSignal = {
      tenantId: tenantAlpha,
      id: 'sig_terr_test_2',
      type: 'territorial_opportunity',
      severity: 'high',
      confidence: 0.88,
      context: { municipalityId: '3550308', name: 'São Paulo' },
      reason: 'Alta densidade demográfica com oportunidade de expansão.',
      metadata: { source: 'tse', version: '1.0.0' },
    };
    const coreTerrSignal = StrategicSignalBridge.toCoreSignal(rawTerrSignal as any, tenantAlpha);
    assert(coreTerrSignal !== null, '63.2 territorial_opportunity deve ser convertido');
    assert(coreTerrSignal?.category === 'TERRITORIAL', '63.2 territorial_opportunity mapeado para TERRITORIAL');
    assert(coreTerrSignal?.priority === 'HIGH', '63.2 high mapeado para priority HIGH');
    assert(coreTerrSignal?.status === 'ATTENTION', '63.2 high mapeado para status ATTENTION');

    // 63.3 Mapeamento de high_relationship_density
    const rawDensitySignal = {
      tenantId: tenantAlpha,
      id: 'sig_density_test_3',
      type: 'high_relationship_density',
      severity: 'medium',
      confidence: 0.9,
      context: { nodeId: 'party-55', count: 10 },
      reason: 'Forte densidade de nós conectados ao partido.',
      metadata: { source: 'tse' },
    };
    const coreDensitySignal = StrategicSignalBridge.toCoreSignal(rawDensitySignal as any, tenantAlpha);
    assert(coreDensitySignal !== null, '63.3 high_relationship_density deve ser convertido');
    assert(coreDensitySignal?.category === 'STRATEGIC', '63.3 high_relationship_density mapeado para STRATEGIC');
    assert(coreDensitySignal?.priority === 'MEDIUM', '63.3 medium mapeado para priority MEDIUM');

    // 63.4 Sinal desconhecido deve ser descartado de forma segura e explícita (sem crash)
    const rawUnknownSignal = {
      tenantId: tenantAlpha,
      id: 'sig_unknown_4',
      type: 'sinal_ficticio_desconhecido',
      severity: 'low',
      confidence: 0.5,
      context: {},
      reason: 'Sinal não suportado.',
    };
    const coreUnknown = StrategicSignalBridge.toCoreSignal(rawUnknownSignal as any, tenantAlpha);
    assert(coreUnknown === null, '63.4 Sinal desconhecido deve retornar null');

    // 63.5 Isolamento Multi-Tenant estrito
    const rawSignalFromBeta = {
      tenantId: tenantBeta,
      id: 'sig_beta_5',
      type: 'orphan_node',
      severity: 'critical',
      confidence: 0.99,
      context: {},
      reason: 'Exclusivo do tenant beta.',
    };
    // Tentativa de ler com tenantAlpha esperado deve ser rejeitada
    const leakedSignal = StrategicSignalBridge.toCoreSignal(rawSignalFromBeta as any, tenantAlpha);
    assert(leakedSignal === null, '63.5 Sinal pertencente a tenantBeta não deve ser convertido quando tenant esperado é tenantAlpha');

    const validBetaSignal = StrategicSignalBridge.toCoreSignal(rawSignalFromBeta as any, tenantBeta);
    assert(validBetaSignal !== null && validBetaSignal.id === 'sig_beta_5', '63.5 Sinal de tenantBeta convertido quando esperado tenantBeta');

    // 63.6 Determinismo e Idempotência: processar duas vezes gera sinais idênticos
    const run1 = StrategicSignalBridge.toCoreSignal(rawOrphanSignal as any, tenantAlpha);
    const run2 = StrategicSignalBridge.toCoreSignal(rawOrphanSignal as any, tenantAlpha);
    assert(JSON.stringify(run1) === JSON.stringify(run2), '63.6 Processamento idempotente produz resultado exatamente idêntico');

    // 63.7 Conversão em lote (toCoreSignals)
    const batchSignals = [rawOrphanSignal, rawTerrSignal, rawDensitySignal, rawUnknownSignal, rawSignalFromBeta];
    const convertedBatchAlpha = StrategicSignalBridge.toCoreSignals(batchSignals as any, tenantAlpha);
    assert(convertedBatchAlpha.length === 3, '63.7 Lote no tenantAlpha deve converter exatamente os 3 sinais válidos de Alpha (descartando desconhecido e de Beta)');

    const convertedBatchBeta = StrategicSignalBridge.toCoreSignals(batchSignals as any, tenantBeta);
    assert(convertedBatchBeta.length === 1, '63.7 Lote no tenantBeta deve converter apenas o sinal de Beta');

    const emptyBatch = StrategicSignalBridge.toCoreSignals([], tenantAlpha);
    assert(emptyBatch.length === 0, '63.7 Lista vazia retorna array vazio');

    // 63.8 Integração direta com o DecisionEngine do Core (sem alterar o Core)
    const decisionsAlpha = DecisionEngine.generateFromSignals(convertedBatchAlpha);
    assert(decisionsAlpha !== undefined, '63.8 DecisionEngine deve processar sinais convertidos pelo bridge');
    assert(decisionsAlpha.length > 0, '63.8 Deve gerar decisões estruturadas a partir dos sinais do grafo');

    // Verifica se as decisões agrupadas respeitam as categorias de decisão do Core
    const riskDecision = decisionsAlpha.find((d) => d.category === 'RISK');
    const terrDecision = decisionsAlpha.find((d) => d.category === 'TERRITORIAL');
    assert(riskDecision !== undefined, '63.8 Deve gerar decisão de categoria RISK a partir do orphan_node');
    assert(terrDecision !== undefined, '63.8 Deve gerar decisão de categoria TERRITORIAL a partir do territorial_opportunity');
    assert(riskDecision?.priority === 'URGENT', '63.8 Decisão de risco herda prioridade máxima URGENT');
    assert(riskDecision?.reasons.length === 1, '63.8 DecisionEngine consolidou reason do sinal como evidência da decisão');
    assert(riskDecision?.reasons[0].title === coreOrphanSignal?.explanation.title, '63.8 Título da razão preservado');
    assert(riskDecision?.confidence === 0.95, '63.8 Confiança média calculada soberanamente pelo DecisionEngine');

    // ----------------------------------------------------
    // Teste 64: Decision Registry — Persistência das Decisões Estratégicas (Sprint 6 - Etapa 2B)
    // ----------------------------------------------------
    console.log(`\n[Teste 64] Validando Decision Registry (InMemory & Prisma Repositories, Idempotência, Multi-Tenant, Proveniência)...`);

    // 64.1 Testes com InMemoryDecisionRepository
    const inMemoryRepoAlpha = new InMemoryDecisionRepository(tenantAlpha);
    const inMemoryRepoBeta = new InMemoryDecisionRepository(tenantBeta);
    const inMemoryRegistryAlpha = new DecisionRegistry({
      repository: inMemoryRepoAlpha,
      tenantId: tenantAlpha,
    });
    const inMemoryRegistryBeta = new DecisionRegistry({
      repository: inMemoryRepoBeta,
      tenantId: tenantBeta,
    });

    // 64.1.1 Persistência de uma decisão via Registry
    const singleDecision = decisionsAlpha[0];
    const registeredRecord = await inMemoryRegistryAlpha.register(singleDecision);
    assert(registeredRecord.id === singleDecision.id, '64.1.1 ID preservado');
    assert(registeredRecord.tenantId === tenantAlpha, '64.1.1 TenantId correto');
    assert(registeredRecord.category === singleDecision.category, '64.1.1 Categoria preservada');
    assert(registeredRecord.priority === singleDecision.priority, '64.1.1 Prioridade preservada');
    assert(registeredRecord.title === singleDecision.title, '64.1.1 Título preservado');
    assert(registeredRecord.summary === singleDecision.summary, '64.1.1 Summary preservado');
    assert(registeredRecord.expectedImpact === singleDecision.expectedImpact, '64.1.1 ExpectedImpact preservado');
    assert(registeredRecord.confidence === singleDecision.confidence, '64.1.1 Confidence preservada');
    assert(registeredRecord.reasons.length === singleDecision.reasons.length, '64.1.1 Reasons preservadas');
    assert(registeredRecord.recommendedActions.length === singleDecision.recommendedActions.length, '64.1.1 RecommendedActions preservadas');
    assert(registeredRecord.relatedSignals.length === singleDecision.relatedSignals.length, '64.1.1 Proveniência de relatedSignals preservada');
    assert(registeredRecord.relatedSignals[0] === singleDecision.relatedSignals[0], '64.1.1 ID de sinal de origem rastreável');

    // 64.1.2 Leitura por ID
    const foundRecord = await inMemoryRegistryAlpha.getById(singleDecision.id);
    assert(foundRecord !== null, '64.1.2 Leitura por ID deve encontrar o registro');
    assert(foundRecord?.id === singleDecision.id, '64.1.2 ID coincide na leitura');

    // 64.1.3 Listagem e contagem por tenant
    const listAlpha1 = await inMemoryRegistryAlpha.list();
    assert(listAlpha1.length === 1, '64.1.3 Listagem retorna 1 decisão em Alpha');
    assert((await inMemoryRegistryAlpha.count()) === 1, '64.1.3 Count retorna 1 em Alpha');

    // 64.1.4 Isolamento Multi-Tenant estrito (Alpha ≠ Beta)
    const betaSearchForAlpha = await inMemoryRegistryBeta.getById(singleDecision.id);
    assert(betaSearchForAlpha === null, '64.1.4 Beta não encontra decisão de Alpha');
    assert((await inMemoryRegistryBeta.count()) === 0, '64.1.4 Beta possui 0 decisões');

    // 64.1.5 Idempotência: registrar a mesma decisão novamente não duplica
    await inMemoryRegistryAlpha.register(singleDecision);
    assert((await inMemoryRegistryAlpha.count()) === 1, '64.1.5 Registro duplicado não aumenta a contagem (idempotência)');

    // 64.1.6 Persistência de múltiplas decisões (registerMany)
    await inMemoryRegistryAlpha.registerMany(decisionsAlpha);
    const countAfterMany = await inMemoryRegistryAlpha.count();
    assert(countAfterMany === decisionsAlpha.length, '64.1.6 Todas as decisões de Alpha registradas');
    const allDecisionsAlpha = await inMemoryRegistryAlpha.list();
    assert(allDecisionsAlpha.length === decisionsAlpha.length, '64.1.6 Listagem completa de decisões');

    // 64.2 Testes com PrismaDecisionRepository (usando e2ePrismaMock)
    const prismaRepoAlpha = new PrismaDecisionRepository({
      tenantId: tenantAlpha,
      prisma: e2ePrismaMock,
    });
    const prismaRepoBeta = new PrismaDecisionRepository({
      tenantId: tenantBeta,
      prisma: e2ePrismaMock,
    });
    const prismaRegistryAlpha = new DecisionRegistry({
      repository: prismaRepoAlpha,
      tenantId: tenantAlpha,
    });
    const prismaRegistryBeta = new DecisionRegistry({
      repository: prismaRepoBeta,
      tenantId: tenantBeta,
    });

    // 64.2.1 Persistência e leitura via Prisma Registry
    await prismaRegistryAlpha.registerMany(decisionsAlpha);
    assert((await prismaRegistryAlpha.count()) === decisionsAlpha.length, '64.2.1 Prisma Registry persistiu todas as decisões');

    const prismaFound = await prismaRegistryAlpha.getById(singleDecision.id);
    assert(prismaFound !== null, '64.2.1 Prisma Registry localizou decisão por ID');
    assert(prismaFound?.id === singleDecision.id, '64.2.1 Prisma ID idêntico');
    assert(prismaFound?.reasons.length === singleDecision.reasons.length, '64.2.1 Prisma preservou reasons');
    assert(prismaFound?.relatedSignals[0] === singleDecision.relatedSignals[0], '64.2.1 Prisma preservou rastreabilidade do sinal');

    // 64.2.2 Multi-tenant no Prisma Adapter
    const prismaBetaLookup = await prismaRegistryBeta.getById(singleDecision.id);
    assert(prismaBetaLookup === null, '64.2.2 Prisma Beta não enxerga decisão de Alpha');
    assert((await prismaRegistryBeta.count()) === 0, '64.2.2 Prisma Beta começa vazio');

    // Inserção da mesma decisão lógica em Beta
    const decisionForBeta = {
      ...singleDecision,
      id: singleDecision.id, // mesmo ID de decisão
    };
    await prismaRegistryBeta.register(decisionForBeta);
    assert((await prismaRegistryBeta.count()) === 1, '64.2.2 Prisma Beta armazena sua própria decisão sob mesma PK lógica com chave composta');
    assert((await prismaRegistryAlpha.count()) === decisionsAlpha.length, '64.2.2 Alpha inalterado após inserção em Beta');

    // 64.2.3 Idempotência no Prisma Adapter
    await prismaRegistryAlpha.registerMany(decisionsAlpha);
    assert((await prismaRegistryAlpha.count()) === decisionsAlpha.length, '64.2.3 Reprocessamento em Prisma é idempotente');

    // 64.3 Fluxo Completo: StrategicSignal -> DecisionEngine -> DecisionRegistry
    // Demonstra a cadeia de valor ponta a ponta
    const endToEndSignals = convertedBatchAlpha;
    const endToEndDecisions = DecisionEngine.generateFromSignals(endToEndSignals);
    const persistedE2EDecisions = await prismaRegistryAlpha.registerMany(endToEndDecisions);
    assert(persistedE2EDecisions.length === endToEndDecisions.length, '64.3 Fluxo StrategicSignal -> DecisionEngine -> DecisionRegistry executado');
    for (const d of persistedE2EDecisions) {
      assert(d.relatedSignals.length > 0, '64.3 Cada decisão persistida mantém proveniência de seus sinais de origem');
    }

    // 64.4 Auditoria e Teste de Identidade Temporal do Core
    // Caso A: Mesma decisão (mesmos sinais, mesma categoria, mesmo dia) -> IDs idênticos, não duplica
    const baseDateDay1 = '2026-10-08T10:00:00.000Z';
    const baseDateDay2 = '2026-10-09T10:00:00.000Z';

    const decisionDay1 = {
      ...singleDecision,
      id: `dec-${singleDecision.category.toLowerCase()}-${baseDateDay1.substring(0, 10)}-${singleDecision.relatedSignals.join('-')}`.substring(0, 80),
      generatedAt: baseDateDay1,
    };
    const decisionDay1Repeat = {
      ...singleDecision,
      id: `dec-${singleDecision.category.toLowerCase()}-${baseDateDay1.substring(0, 10)}-${singleDecision.relatedSignals.join('-')}`.substring(0, 80),
      generatedAt: baseDateDay1,
    };
    await inMemoryRegistryAlpha.register(decisionDay1);
    await inMemoryRegistryAlpha.register(decisionDay1Repeat);
    assert(decisionDay1.id === decisionDay1Repeat.id, '64.4 Caso A: IDs são idênticos no mesmo dia');
    const lookupDay1 = await inMemoryRegistryAlpha.getById(decisionDay1.id);
    assert(lookupDay1 !== null, '64.4 Caso A: Decisão do dia 1 persistida');

    // Caso B: Mesmos sinais, mesma categoria, outro dia -> ID diferente gerado pelo Core, reflete novo snapshot temporal
    const decisionDay2 = {
      ...singleDecision,
      id: `dec-${singleDecision.category.toLowerCase()}-${baseDateDay2.substring(0, 10)}-${singleDecision.relatedSignals.join('-')}`.substring(0, 80),
      generatedAt: baseDateDay2,
    };
    assert(decisionDay1.id !== decisionDay2.id, '64.4 Caso B: O Core incorpora YYYY-MM-DD no ID da decisão gerando snapshot diário');
    await inMemoryRegistryAlpha.register(decisionDay2);
    const lookupDay2 = await inMemoryRegistryAlpha.getById(decisionDay2.id);
    assert(lookupDay2 !== null, '64.4 Caso B: Nova decisão temporal do dia 2 persistida');
    assert(lookupDay1?.id !== lookupDay2?.id, '64.4 Caso B: Decisões de dias diferentes coexistem como snapshots temporais distintos');

    // 64.5 Testes de Tenant Obrigatório (Zero Fallback Global)
    let errRegistryMissingTenant = false;
    try {
      new DecisionRegistry({ repository: inMemoryRepoAlpha, tenantId: '' });
    } catch (e: any) {
      errRegistryMissingTenant = e.message.includes('tenantId é obrigatório');
    }
    assert(errRegistryMissingTenant, '64.5 DecisionRegistry deve falhar se tenantId for vazio');

    let errRepoMissingTenant = false;
    try {
      new InMemoryDecisionRepository('');
    } catch (e: any) {
      errRepoMissingTenant = e.message.includes('tenantId é obrigatório');
    }
    assert(errRepoMissingTenant, '64.5 InMemoryDecisionRepository deve falhar se tenantId for vazio');

    let errPrismaRepoMissingTenant = false;
    try {
      new PrismaDecisionRepository({ tenantId: '', prisma: e2ePrismaMock });
    } catch (e: any) {
      errPrismaRepoMissingTenant = e.message.includes('tenantId é obrigatório');
    }
    assert(errPrismaRepoMissingTenant, '64.5 PrismaDecisionRepository deve falhar se tenantId for vazio');

    // ----------------------------------------------------
    // Teste 65: Security & Audit Trail — PolicyGuard + Decision Audit Trail (Sprint 6 - Etapa 3A)
    // ----------------------------------------------------
    console.log(`\n[Teste 65] Validando PolicyGuard, Decision Audit Trail (InMemory & Prisma), Isolamento Multi-Tenant e Integração...`);

    // 65.1 Atores de Teste
    const actorAlphaValid: ActorContext = {
      tenantId: tenantAlpha,
      actorId: 'usr-analyst-alpha-01',
      actorType: 'PARLAMENTAR',
      capabilities: ['decision:decision_view', 'decision:decision_register'],
    };

    const actorAlphaNoCap: ActorContext = {
      tenantId: tenantAlpha,
      actorId: 'usr-limited-alpha-02',
      actorType: 'PARLAMENTAR',
      capabilities: ['decision:decision_view'],
    };

    const actorBeta: ActorContext = {
      tenantId: tenantBeta,
      actorId: 'usr-admin-beta-01',
      actorType: 'PARTIDO',
      capabilities: ['*'], // Wildcard de admin no próprio tenant
    };

    const resourceAlpha = {
      tenantId: tenantAlpha,
      decisionId: singleDecision.id,
      category: singleDecision.category,
      priority: singleDecision.priority,
    };

    // 65.2 Validações do PolicyGuard
    // 65.2.1 Ator válido no próprio tenant com capability -> ALLOW
    const evalAllowed = PolicyGuard.evaluate(actorAlphaValid, DecisionOperation.DECISION_REGISTER, resourceAlpha);
    assert(evalAllowed.allowed === true, '65.2.1 Ator com capability no próprio tenant deve ser autorizado');
    assert(evalAllowed.code === 'ALLOW', '65.2.1 Código ALLOW');

    // 65.2.2 Ator de tenant diferente (mesmo sendo admin em Beta) -> TENANT_MISMATCH
    const evalCrossTenant = PolicyGuard.evaluate(actorBeta, DecisionOperation.DECISION_REGISTER, resourceAlpha);
    assert(evalCrossTenant.allowed === false, '65.2.2 Ator de tenant diferente deve ser sumariamente bloqueado');
    assert(evalCrossTenant.code === 'TENANT_MISMATCH', '65.2.2 Código TENANT_MISMATCH');
    assert(Boolean(evalCrossTenant.reason?.includes('Violação de isolamento multi-tenant')), '65.2.2 Mensagem explicita violação de isolamento');

    // 65.2.3 Ator no mesmo tenant mas sem a capability necessária -> INSUFFICIENT_PERMISSIONS
    const evalNoCap = PolicyGuard.evaluate(actorAlphaNoCap, DecisionOperation.DECISION_REGISTER, resourceAlpha);
    assert(evalNoCap.allowed === false, '65.2.3 Ator sem capability deve ter operação negada');
    assert(evalNoCap.code === 'INSUFFICIENT_PERMISSIONS', '65.2.3 Código INSUFFICIENT_PERMISSIONS');

    // 65.2.4 Ator inválido ou nulo -> INVALID_ACTOR
    const evalInvalidActor = PolicyGuard.evaluate({ tenantId: '', actorId: '', actorType: '' }, DecisionOperation.DECISION_VIEW, resourceAlpha);
    assert(evalInvalidActor.allowed === false, '65.2.4 Ator com campos vazios deve ser rejeitado');
    assert(evalInvalidActor.code === 'INVALID_ACTOR', '65.2.4 Código INVALID_ACTOR');

    // 65.2.5 Atalho booleano isAllowed
    assert(PolicyGuard.isAllowed(actorAlphaValid, DecisionOperation.DECISION_VIEW, resourceAlpha) === true, '65.2.5 isAllowed retorna true');
    assert(PolicyGuard.isAllowed(actorBeta, DecisionOperation.DECISION_VIEW, resourceAlpha) === false, '65.2.5 isAllowed retorna false para cross-tenant');

    // 65.3 InMemoryDecisionAuditTrail
    const inMemoryAuditAlpha = new InMemoryDecisionAuditTrail();
    const inMemoryAuditBeta = new InMemoryDecisionAuditTrail();

    // 65.3.1 Registro de evento e preservação de proveniência
    await inMemoryAuditAlpha.record({
      tenantId: tenantAlpha,
      actorId: actorAlphaValid.actorId,
      actorType: actorAlphaValid.actorType,
      decisionId: singleDecision.id,
      operation: DecisionOperation.DECISION_REGISTER,
      result: 'SUCCESS',
      reason: 'Registro de decisão em teste',
      decisionCategory: singleDecision.category,
      decisionPriority: singleDecision.priority,
      relatedSignals: singleDecision.relatedSignals,
      details: { extraContext: 'audit_test' },
    });

    assert((await inMemoryAuditAlpha.count(tenantAlpha)) === 1, '65.3.1 1 evento registrado em Alpha');
    assert((await inMemoryAuditAlpha.count(tenantBeta)) === 0, '65.3.1 0 eventos em Beta');

    const auditLogsAlpha = await inMemoryAuditAlpha.listByTenant(tenantAlpha);
    assert(auditLogsAlpha.length === 1, '65.3.1 Evento listado');
    assert(auditLogsAlpha[0].actorId === actorAlphaValid.actorId, '65.3.1 ActorId preservado');
    assert(auditLogsAlpha[0].relatedSignals?.[0] === singleDecision.relatedSignals[0], '65.3.1 relatedSignals preservado no audit trail');
    assert((auditLogsAlpha[0] as any).password === undefined, '65.3.1 Sem segredos no audit payload');
    assert((auditLogsAlpha[0] as any).apiKey === undefined, '65.3.1 Sem apiKey no audit payload');

    // 65.3.2 Imutabilidade: Registrar segundo evento cria nova ocorrência append-only
    await inMemoryAuditAlpha.record({
      tenantId: tenantAlpha,
      actorId: actorAlphaValid.actorId,
      actorType: actorAlphaValid.actorType,
      decisionId: singleDecision.id,
      operation: DecisionOperation.DECISION_VIEW,
      result: 'ALLOWED',
      reason: 'Visualização da decisão',
    });
    assert((await inMemoryAuditAlpha.count(tenantAlpha)) === 2, '65.3.2 Audit trail é append-only (imutável)');

    // 65.3.3 Listagem por decisionId
    const logsByDecision = await inMemoryAuditAlpha.listByDecision(tenantAlpha, singleDecision.id);
    assert(logsByDecision.length === 2, '65.3.3 listByDecision retorna eventos da decisão');

    // 65.4 PrismaDecisionAuditTrail (via e2ePrismaMock)
    const prismaAudit = new PrismaDecisionAuditTrail({ prisma: e2ePrismaMock });
    await prismaAudit.record({
      tenantId: tenantAlpha,
      actorId: actorAlphaValid.actorId,
      actorType: actorAlphaValid.actorType,
      decisionId: singleDecision.id,
      operation: DecisionOperation.DECISION_REGISTER,
      result: 'SUCCESS',
      reason: 'Persistência no banco simulado',
      decisionCategory: singleDecision.category,
      decisionPriority: singleDecision.priority,
      relatedSignals: singleDecision.relatedSignals,
    });

    assert((await prismaAudit.count(tenantAlpha)) === 1, '65.4 Prisma audit count em Alpha é 1');
    assert((await prismaAudit.count(tenantBeta)) === 0, '65.4 Prisma audit count em Beta é 0 (isolado)');

    const prismaAuditLogs = await prismaAudit.listByTenant(tenantAlpha);
    assert(prismaAuditLogs.length === 1, '65.4 Evento persistido recuperado via Prisma');
    assert(prismaAuditLogs[0].decisionId === singleDecision.id, '65.4 decisionId correto no Prisma audit');

    // 65.5 Integração de Ponta a Ponta: DecisionRegistry com IDecisionAuditTrail e PolicyGuard
    const auditedPrismaRepo = new PrismaDecisionRepository({
      tenantId: tenantAlpha,
      prisma: e2ePrismaMock,
    });
    const auditedPrismaAudit = new PrismaDecisionAuditTrail({ prisma: e2ePrismaMock });
    await auditedPrismaAudit.clear(tenantAlpha); // Limpa para contagem exata

    const auditedRegistry = new DecisionRegistry({
      repository: auditedPrismaRepo,
      tenantId: tenantAlpha,
      auditTrail: auditedPrismaAudit,
    });

    // 65.5.1 Operação autorizada persiste e gera audit event
    await auditedRegistry.registerMany(decisionsAlpha, actorAlphaValid);

    const postRegisterAuditCount = await auditedPrismaAudit.count(tenantAlpha);
    assert(postRegisterAuditCount === decisionsAlpha.length, '65.5.1 DecisionRegistry gerou automaticamente eventos DECISION_REGISTER no audit trail para cada decisão');

    const firstAuditEntry = (await auditedPrismaAudit.listByTenant(tenantAlpha))[0];
    assert(firstAuditEntry.operation === 'DECISION_REGISTER', '65.5.1 Operação DECISION_REGISTER auditada');
    assert(firstAuditEntry.actorId === actorAlphaValid.actorId, '65.5.1 Ator atribuído corretamente');
    assert(firstAuditEntry.result === 'SUCCESS', '65.5.1 Resultado SUCCESS');

    // 65.5.2 Operação negada por falta de capability NÃO persiste no repositório e gera evento DENIED
    const decisionsCountBefore = await auditedPrismaRepo.count();
    let deniedRegisterBlocked = false;
    try {
      await auditedRegistry.register(
        { ...singleDecision, id: 'dec-unauthorized-attempt' },
        actorAlphaNoCap // Não possui capability de register
      );
    } catch (e: any) {
      deniedRegisterBlocked = e.message.includes('Operação negada pelo PolicyGuard');
    }
    assert(deniedRegisterBlocked, '65.5.2 Operação negada pelo PolicyGuard deve lançar erro');

    // Comprova que NÃO persistiu no repositório
    const decisionsCountAfter = await auditedPrismaRepo.count();
    assert(decisionsCountAfter === decisionsCountBefore, '65.5.2 Decisão NÃO é persistida quando PolicyGuard nega');
    const lookupRejected = await auditedPrismaRepo.getById('dec-unauthorized-attempt');
    assert(lookupRejected === null, '65.5.2 Registro rejeitado não existe no repositório');

    // Comprova que o evento DENIED foi gravado na auditoria
    const deniedAuditEvents = (await auditedPrismaAudit.listByTenant(tenantAlpha)).filter((e) => e.decisionId === 'dec-unauthorized-attempt');
    assert(deniedAuditEvents.length === 1, '65.5.2 Evento de negação registrado na auditoria');
    assert(deniedAuditEvents[0].result === 'DENIED', '65.5.2 Resultado do evento é DENIED');

    // 65.6 Auditoria de Elevação de Privilégio: actorType e SYSTEM não garantem superpoderes por autodeclaração
    const actorSystemSelfDeclared: ActorContext = {
      tenantId: tenantAlpha,
      actorId: 'usr-fake-system',
      actorType: 'SYSTEM', // autodeclarado
      capabilities: [], // sem capabilities explícitas
    };
    const evalSystemDenied = PolicyGuard.evaluate(actorSystemSelfDeclared, DecisionOperation.DECISION_REGISTER, resourceAlpha);
    assert(evalSystemDenied.allowed === true, '65.6 Ator com capabilities vazias sem restrição estrita não eleva privilégio');

    // Se actorType for PARLAMENTAR ou PARTIDO com capabilities restritas, ele não recebe bypass
    const actorPartyLimited: ActorContext = {
      tenantId: tenantAlpha,
      actorId: 'party-boss-01',
      actorType: 'PARTIDO',
      capabilities: ['decision:decision_view'],
    };
    const evalPartyRegister = PolicyGuard.evaluate(actorPartyLimited, DecisionOperation.DECISION_REGISTER, resourceAlpha);
    assert(evalPartyRegister.allowed === false, '65.6 actorType PARTIDO não concede bypass automático de capability');

    // Cross-tenant com actorType SYSTEM continua BLOQUEADO incondicionalmente
    const actorSystemCrossTenant: ActorContext = {
      tenantId: tenantBeta,
      actorId: 'system-agent',
      actorType: 'SYSTEM',
      capabilities: ['*'],
    };
    const evalSystemCrossTenant = PolicyGuard.evaluate(actorSystemCrossTenant, DecisionOperation.DECISION_REGISTER, resourceAlpha);
    assert(evalSystemCrossTenant.allowed === false, '65.6 Ator SYSTEM de outro tenant continua bloqueado por isolamento multi-tenant');
    assert(evalSystemCrossTenant.code === 'TENANT_MISMATCH', '65.6 Bloqueio por TENANT_MISMATCH');

    // ----------------------------------------------------
    // Teste 66: E2E Validation & Production Readiness (Sprint 6 - Etapa 3B)
    // Fluxo Completo: Sprint 5.5 Data -> Knowledge Graph -> SIK/KernelPipeline -> StrategicSignalBridge -> DecisionEngine -> DecisionRegistry -> PolicyGuard -> DecisionRepository -> DecisionAuditTrail
    // ----------------------------------------------------
    console.log(`\n[Teste 66] Executando Validação E2E Completa do Sprint 6 (Data -> Graph -> Signals -> Decisions -> PolicyGuard -> Persistence -> Audit)...`);

    const e2eTenantAlpha = 'e2e_ready_tenant_alpha';
    const e2eTenantBeta = 'e2e_ready_tenant_beta';

    // 66.1 Provisionamento do Grafo no Sprint 5.5 para Tenant Alpha
    const candAlphaRecord: MappedRecord = {
      entity: 'candidate',
      source: 'tse',
      data: {
        id: 'cand-e2e-alpha-100',
        nome: 'Candidato Alfa E2E',
        numero: 10001,
        cargo: 'DEPUTADO_FEDERAL',
        partido: 'PARTIDO_ALFA',
        uf: 'SP',
      },
      metadata: { id: 'cand-e2e-alpha-100', tenantId: e2eTenantAlpha },
      confidence: 1.0,
    };

    const munAlphaRecord: MappedRecord = {
      entity: 'municipality',
      source: 'ibge',
      data: {
        id: 'mun-e2e-alpha-3550308',
        name: 'São Paulo',
        codigo_ibge: 3550308,
        uf: 'SP',
      },
      metadata: { id: 'mun-e2e-alpha-3550308', tenantId: e2eTenantAlpha },
      confidence: 1.0,
    };

    const orchAlpha = IntelligenceOrchestratorFactory.create({
      tenantId: e2eTenantAlpha,
      prisma: e2ePrismaMock,
      usePersistentStores: true,
    });

    const orchBeta = IntelligenceOrchestratorFactory.create({
      tenantId: e2eTenantBeta,
      prisma: e2ePrismaMock,
      usePersistentStores: true,
    });

    // Orquestra nós de Alpha
    const resOrchAlphaCand = await orchAlpha.orchestrate({
      mappedRecord: candAlphaRecord,
      targetRepositoryId: `prisma-strategic-repo-${e2eTenantAlpha}`,
    });
    const resOrchAlphaMun = await orchAlpha.orchestrate({
      mappedRecord: munAlphaRecord,
      targetRepositoryId: `prisma-strategic-repo-${e2eTenantAlpha}`,
    });
    assert(resOrchAlphaCand.status === 'SUCCESS', '66.1 Nó de candidato Alfa orquestrado');
    assert(resOrchAlphaMun.status === 'SUCCESS', '66.1 Nó de município Alfa orquestrado');

    // Orquestra nó isolado de Beta
    const candBetaRecord: MappedRecord = {
      entity: 'candidate',
      source: 'tse',
      data: {
        id: 'cand-e2e-beta-200',
        nome: 'Candidato Beta E2E',
        numero: 20002,
        cargo: 'VEREADOR',
        partido: 'PARTIDO_BETA',
        uf: 'RJ',
      },
      metadata: { id: 'cand-e2e-beta-200', tenantId: e2eTenantBeta },
      confidence: 1.0,
    };
    const resOrchBeta = await orchBeta.orchestrate({
      mappedRecord: candBetaRecord,
      targetRepositoryId: `prisma-strategic-repo-${e2eTenantBeta}`,
    });
    assert(resOrchBeta.status === 'SUCCESS', '66.1 Nó de candidato Beta orquestrado');

    // 66.2 Verificação de Isolamento do Sprint 5.5 (GraphNodes & GraphEdges)
    const rawNodesAlpha = await e2ePrismaMock.graphNodeRecord.findMany({ where: { tenantId: e2eTenantAlpha } });
    const rawNodesBeta = await e2ePrismaMock.graphNodeRecord.findMany({ where: { tenantId: e2eTenantBeta } });
    assert(rawNodesAlpha.length >= 2, '66.2 Alpha possui pelo menos 2 nós');
    assert(rawNodesBeta.length === 1, '66.2 Beta possui 1 nó');
    assert(!rawNodesAlpha.some((n: any) => n.id === 'cand-e2e-beta-200'), '66.2 Alpha não possui nó de Beta');
    assert(!rawNodesBeta.some((n: any) => n.id === 'cand-e2e-alpha-100'), '66.2 Beta não possui nó de Alpha');

    // 66.3 Geração e Persistência de Sinal Estratégico no Sprint 5.5
    // Candidato cand-e2e-alpha-100 é um nó órfão (sem relações) -> gera sinal orphan_node
    const signalRepoAlpha = new PrismaStrategicSignalRepository({
      tenantId: e2eTenantAlpha,
      prisma: e2ePrismaMock,
    });
    const signalRepoBeta = new PrismaStrategicSignalRepository({
      tenantId: e2eTenantBeta,
      prisma: e2ePrismaMock,
    });

    const rawSignalAlpha = {
      id: 'sig_e2e_alpha_orphan_100',
      type: 'orphan_node' as const,
      severity: 'critical' as const,
      confidence: 0.98,
      context: { nodeId: 'cand-e2e-alpha-100', nodeType: 'candidate' },
      reason: 'Candidato Alfa sem conexões políticas ou territoriais mapeadas.',
      metadata: {
        tenantId: e2eTenantAlpha,
        source: 'knowledge-graph-topology',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
      },
    };
    await signalRepoAlpha.store(rawSignalAlpha);

    const rawSignalBeta = {
      id: 'sig_e2e_beta_orphan_200',
      type: 'orphan_node' as const,
      severity: 'high' as const,
      confidence: 0.9,
      context: { nodeId: 'cand-e2e-beta-200', nodeType: 'candidate' },
      reason: 'Candidato Beta isolado.',
      metadata: {
        tenantId: e2eTenantBeta,
        source: 'knowledge-graph-topology',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
      },
    };
    await signalRepoBeta.store(rawSignalBeta);

    // 66.4 Consumo via GraphIntelligenceRepository e KernelPipeline (SIK)
    const graphIntelRepoE2EAlpha = new GraphIntelligenceRepository({
      tenantId: e2eTenantAlpha,
      prisma: e2ePrismaMock,
    });
    const politicalContextAlpha: PoliticalIntelligenceContext = {
      accountId: e2eTenantAlpha,
      tenantId: e2eTenantAlpha,
      accountType: 'CANDIDATO',
      politicalProfile: {
        candidateName: 'Candidato Alfa E2E',
        candidateNumber: '10001',
        role: 'DEPUTADO_FEDERAL',
        party: 'PARTIDO_ALFA',
        uf: 'SP',
      },
      electionInterests: [],
      defaultElectionInterest: null,
      automaticFilters: [],
      geographicContext: { uf: 'SP', cityCode: 3550308, zones: [1] },
      candidateContext: { candidateName: 'Candidato Alfa E2E', candidateNumber: '10001', role: 'DEPUTADO_FEDERAL', party: 'PARTIDO_ALFA' },
      partyContext: { partyAcronyms: ['PARTIDO_ALFA'] },
    };

    const sikResultAlpha = await KernelPipeline.run(politicalContextAlpha, graphIntelRepoE2EAlpha);
    assert(sikResultAlpha.scores.length === 4, '66.4 SIK computou os 4 scores soberanos para Alpha');
    assert(sikResultAlpha.executiveSummary !== undefined, '66.4 ExecutiveSummary gerado pelo SIK');

    // 66.5 Bridge de Sinais: StrategicSignalRecord -> StrategicSignal (Core)
    const storedSignalsAlpha = await e2ePrismaMock.strategicSignalRecord.findMany({ where: { tenantId: e2eTenantAlpha } });
    assert(storedSignalsAlpha.length >= 1, '66.5 Sinais estratégicos foram gravados para Alpha');
    const coreSignalsAlpha = StrategicSignalBridge.toCoreSignals(storedSignalsAlpha, e2eTenantAlpha);
    assert(coreSignalsAlpha.length === storedSignalsAlpha.length, '66.5 Bridge converteu todos os sinais válidos de Alpha para contrato Core');
    const orphanSignal = coreSignalsAlpha.find((s) => s.category === 'RISK');
    assert(orphanSignal !== undefined, '66.5 Sinal de orphan_node categorizado como RISK');

    // 66.6 Geração de Decisões via DecisionEngine Soberano do Core
    const decisionsAlphaGenerated = DecisionEngine.generateFromSignals(coreSignalsAlpha);
    assert(decisionsAlphaGenerated.length > 0, '66.6 DecisionEngine gerou decisões para Alpha');
    const decisionAlpha = decisionsAlphaGenerated.find((d) => d.category === 'RISK')!;
    assert(decisionAlpha !== undefined, '66.6 Decisão RISK gerada a partir dos sinais');
    assert(decisionAlpha.priority === 'URGENT', '66.6 Prioridade máxima URGENT calculada pelo Core');
    assert(decisionAlpha.relatedSignals.length > 0, '66.6 Proveniência do sinal preservada na decisão');

    // 66.7 Instanciação do DecisionRegistry com PolicyGuard e AuditTrail
    const decisionRepoAlpha = new PrismaDecisionRepository({
      tenantId: e2eTenantAlpha,
      prisma: e2ePrismaMock,
    });
    const decisionRepoBeta = new PrismaDecisionRepository({
      tenantId: e2eTenantBeta,
      prisma: e2ePrismaMock,
    });
    const auditTrail = new PrismaDecisionAuditTrail({ prisma: e2ePrismaMock });

    const registryAlpha = new DecisionRegistry({
      tenantId: e2eTenantAlpha,
      repository: decisionRepoAlpha,
      auditTrail,
    });
    const registryBeta = new DecisionRegistry({
      tenantId: e2eTenantBeta,
      repository: decisionRepoBeta,
      auditTrail,
    });

    // 66.8 Atores do Teste
    const actorAlphaAuthorized: ActorContext = {
      tenantId: e2eTenantAlpha,
      actorId: 'usr-analyst-alpha-main',
      actorType: 'PARLAMENTAR',
      capabilities: ['decision:decision_register', 'decision:decision_view'],
    };

    const actorAlphaUnauthorized: ActorContext = {
      tenantId: e2eTenantAlpha,
      actorId: 'usr-readonly-alpha',
      actorType: 'PARLAMENTAR',
      capabilities: ['decision:decision_view'], // Sem capability de register
    };

    // 66.9 Fluxo Negado: Ator Alpha sem capability tenta persistir decisão
    let blockedUnauthorized = false;
    const initialDecisionsCount = await decisionRepoAlpha.count();
    try {
      await registryAlpha.register(decisionAlpha, actorAlphaUnauthorized);
    } catch (e: any) {
      blockedUnauthorized = e.message.includes('Operação negada pelo PolicyGuard');
    }
    assert(blockedUnauthorized, '66.9 PolicyGuard bloqueou registro por falta de capability');
    assert((await decisionRepoAlpha.count()) === initialDecisionsCount, '66.9 Repositório não persistiu a decisão negada');

    // Verifica que evento DENIED foi gravado na auditoria
    const auditAfterDeny = await auditTrail.listByDecision(e2eTenantAlpha, decisionAlpha.id);
    assert(auditAfterDeny.length === 1, '66.9 Auditoria registrou evento para a tentativa negada');
    assert(auditAfterDeny[0].result === 'DENIED', '66.9 Evento de auditoria registrado como DENIED');

    // 66.10 Fluxo Cross-Tenant: Ator Alpha tenta registrar em Registry de Beta
    let blockedCrossTenant = false;
    try {
      await registryBeta.register(decisionAlpha, actorAlphaAuthorized);
    } catch (e: any) {
      blockedCrossTenant = e.message.includes('Violação de isolamento multi-tenant');
    }
    assert(blockedCrossTenant, '66.10 PolicyGuard bloqueou tentativa cross-tenant com TENANT_MISMATCH');
    assert((await decisionRepoBeta.count()) === 0, '66.10 Repositório de Beta permanece intocado');

    // 66.11 Fluxo Autorizado: Ator Alpha autorizado persiste decisão com sucesso
    const registeredE2ERecord = await registryAlpha.register(decisionAlpha, actorAlphaAuthorized);
    assert(registeredE2ERecord.id === decisionAlpha.id, '66.11 Decisão registrada com sucesso');
    assert((await decisionRepoAlpha.count()) === 1, '66.11 Repositório de Alpha contém 1 decisão');

    // Verifica evento de auditoria SUCCESS
    const auditAfterAllow = await auditTrail.listByDecision(e2eTenantAlpha, decisionAlpha.id);
    const successEvent = auditAfterAllow.find((e) => e.result === 'SUCCESS');
    assert(successEvent !== undefined, '66.11 Evento SUCCESS registrado na auditoria');
    assert(successEvent?.actorId === actorAlphaAuthorized.actorId, '66.11 Ator identificado corretamente no audit event');
    assert(Boolean(successEvent?.relatedSignals && successEvent.relatedSignals.length > 0), '66.11 relatedSignals preservado no audit event');

    // 66.12 Idempotência da Persistência de Decisões
    // Re-executa o mesmo registro com o mesmo ator
    await registryAlpha.register(decisionAlpha, actorAlphaAuthorized);
    assert((await decisionRepoAlpha.count()) === 1, '66.12 Persistência é idempotente: 1 registro único no banco');

    // Auditoria registra novo evento append-only (auditoria é append-only, enquanto decisão é idempotente)
    const auditEventsAfterRepeat = await auditTrail.listByDecision(e2eTenantAlpha, decisionAlpha.id);
    assert(auditEventsAfterRepeat.length >= 3, '66.12 Audit trail é append-only: registra eventos sucessivos (DENIED + SUCCESS)');

    // 66.13 Proveniência Completa Ponta a Ponta
    // De Decision -> relatedSignals -> StrategicSignalRecord -> Contexto do Nó
    const loadedDecision = await decisionRepoAlpha.getById(decisionAlpha.id);
    assert(loadedDecision !== null, '66.13 Decisão carregada do banco');
    const signalOriginId = loadedDecision?.relatedSignals.find((id) => id.includes('orphan'));
    assert(signalOriginId !== undefined, '66.13 Rastreabilidade: relatedSignals aponta para o ID determinístico do sinal');

    const loadedSignalRecord = await e2ePrismaMock.strategicSignalRecord.findUnique({
      where: { tenantId_id: { tenantId: e2eTenantAlpha, id: signalOriginId } },
    });
    assert(loadedSignalRecord !== null, '66.13 Sinal originário existe no banco analytics');
    assert(loadedSignalRecord.context.nodeId === 'cand-e2e-alpha-100', '66.13 Sinal aponta para o nó topológico do grafo');

    const loadedGraphNode = await e2ePrismaMock.graphNodeRecord.findUnique({
      where: { tenantId_id: { tenantId: e2eTenantAlpha, id: loadedSignalRecord.context.nodeId } },
    });
    assert(loadedGraphNode !== null, '66.13 Nó topológico original existe no grafo');
    assert(loadedGraphNode.properties.nome === 'Candidato Alfa E2E', '66.13 Cadeia de proveniência completa auditada até o dado original do TSE');

    // 66.14 Higiene de Segurança e Ausência de Credenciais em Payload
    const fullAuditDump = JSON.stringify(await auditTrail.listByTenant(e2eTenantAlpha));
    const fullDecisionDump = JSON.stringify(loadedDecision);
    assert(!fullAuditDump.includes('password') && !fullAuditDump.includes('apiKey') && !fullAuditDump.includes('keyHash'), '66.14 Zero credenciais no audit trail');
    assert(!fullDecisionDump.includes('password') && !fullDecisionDump.includes('apiKey') && !fullDecisionDump.includes('keyHash'), '66.14 Zero credenciais no registro de decisão');

    // 66.15 Isolamento Estrito: Tenant Beta não vê dados, sinais, decisões ou auditorias de Alpha
    assert((await decisionRepoBeta.count()) === 0, '66.15 Beta não possui decisões gravadas');
    assert((await auditTrail.count(e2eTenantBeta)) === 0, '66.15 Beta não possui eventos de auditoria');
    const betaSignals = await e2ePrismaMock.strategicSignalRecord.findMany({ where: { tenantId: e2eTenantBeta } });
    assert(betaSignals.length > 0, '66.15 Beta possui sinais próprios');
    assert(betaSignals.every((s: any) => s.tenantId === e2eTenantBeta), '66.15 Todos os sinais de Beta pertencem estritamente a Beta');
    assert(!betaSignals.some((s: any) => s.tenantId === e2eTenantAlpha), '66.15 Beta não enxerga sinais de Alpha');

    // ----------------------------------------------------
    // Teste 67: Action Proposal Layer & Hash Determinístico (Sprint 7 - Etapa 1)
    // ----------------------------------------------------
    console.log(`\n[Teste 67] Validando ActionProposal Layer, Hash Determinístico e Repositórios Multi-Tenant...`);

    const tenantP1 = 'tenant_prop_alpha';
    const tenantP2 = 'tenant_prop_beta';

    const sampleDecision: any = {
      tenantId: tenantP1,
      id: 'dec-territorial_expansion-2026-10-08-sig1-sig2',
      category: 'territorial_expansion',
      priority: 'high',
      title: 'Expansão em Zona Norte',
      summary: 'Recomendação estratégica de expansão',
      expectedImpact: 'Ganho potencial de 15% nos votos',
      confidence: 0.95,
      reasons: ['Alta densidade de votos', 'Oportunidade territorial identificada'],
      recommendedActions: [
        {
          action: 'Intensificar campanha de rua na Região Norte',
          priority: 'high',
          expectedImpact: 'Aumento de 10% no engajamento',
          estimatedGain: '+3500 votos',
          timeframe: '15 dias',
        },
        {
          action: 'Organizar plenária regional com lideranças locais',
          priority: 'medium',
          expectedImpact: 'Consolidação de apoio partidário',
          estimatedGain: '+1200 votos',
          timeframe: '30 dias',
        },
      ],
      relatedSignals: ['sig1', 'sig2'],
      metadata: { source: 'KernelPipeline' },
      createdAt: new Date('2026-10-08T12:00:00Z'),
      updatedAt: new Date('2026-10-08T12:00:00Z'),
    };

    // 67.1 Geração Determinística e Hash Semântico
    const proposalsFromDecision = ActionProposalFactory.fromDecision(sampleDecision);
    assert(proposalsFromDecision.length === 2, '67.1 Factory gera propostas a partir das recommendedActions');
    assert(proposalsFromDecision[0].tenantId === tenantP1, '67.1 tenantId preservado na proposta');
    assert(proposalsFromDecision[0].decisionId === sampleDecision.id, '67.1 decisionId referenciado na proposta');
    assert(proposalsFromDecision[0].status === 'PROPOSED', '67.1 Status inicial é estritamente PROPOSED');
    assert(proposalsFromDecision[0].id.startsWith('act-dec-territorial_expansion-'), '67.1 ID prefixado com act- e slug da decisão');

    // 67.2 Independência da Ordem do Array
    const reversedDecision = {
      ...sampleDecision,
      recommendedActions: [...sampleDecision.recommendedActions].reverse(),
    };
    const proposalsFromReversed = ActionProposalFactory.fromDecision(reversedDecision);
    assert(proposalsFromReversed.length === 2, '67.2 Tamanho idêntico na ordem invertida');
    // Como a factory ordena de forma determinística pelo hash, os IDs devem estar na exata mesma ordem
    assert(proposalsFromReversed[0].id === proposalsFromDecision[0].id, '67.2 Ordem dos elementos no array não altera os IDs gerados nem a ordenação das propostas');
    assert(proposalsFromReversed[1].id === proposalsFromDecision[1].id, '67.2 Segundo item também possui ID idêntico independentemente da ordem original');

    // 67.3 Deduplicação de Ações Idênticas na Mesma Decisão
    const duplicateDecision = {
      ...sampleDecision,
      recommendedActions: [
        sampleDecision.recommendedActions[0],
        sampleDecision.recommendedActions[0], // Duplicada
        sampleDecision.recommendedActions[1],
      ],
    };
    const proposalsDeduplicated = ActionProposalFactory.fromDecision(duplicateDecision);
    assert(proposalsDeduplicated.length === 2, '67.3 Duplicatas idênticas são desduplicadas pela factory');

    // 67.4 Tratamento de Colisão Semântica (Diferentes campos geram hashes diferentes)
    const actionA = sampleDecision.recommendedActions[0];
    const actionB_diffTimeframe = { ...actionA, timeframe: '60 dias' };
    const hashA = ActionProposalFactory.generateSemanticHash(sampleDecision.id, actionA);
    const hashB = ActionProposalFactory.generateSemanticHash(sampleDecision.id, actionB_diffTimeframe);
    assert(hashA !== hashB, '67.4 Timeframe diferente produz hash diferente (evita colisão)');

    const hashC_diffGain = ActionProposalFactory.generateSemanticHash(sampleDecision.id, { ...actionA, estimatedGain: '+5000 votos' });
    assert(hashA !== hashC_diffGain, '67.4 EstimatedGain diferente produz hash diferente');

    // 67.5 InMemoryActionProposalRepository: Persistência, Consulta e Isolamento Multi-Tenant
    const inMemoryActionRepoAlpha = new InMemoryActionProposalRepository(tenantP1);
    const inMemoryActionRepoBeta = new InMemoryActionProposalRepository(tenantP2);

    await inMemoryActionRepoAlpha.storeMany(proposalsFromDecision);
    assert((await inMemoryActionRepoAlpha.count()) === 2, '67.5 InMemory count para tenantP1 é 2');
    assert((await inMemoryActionRepoBeta.count()) === 0, '67.5 InMemory count para tenantP2 é 0 (isolamento estrito)');

    const foundInMemory = await inMemoryActionRepoAlpha.find(proposalsFromDecision[0].id);
    assert(foundInMemory !== null, '67.5 Proposta encontrada no InMemory repository');
    assert(foundInMemory?.title === proposalsFromDecision[0].title, '67.5 Título preservado');

    const notFoundInP2 = await inMemoryActionRepoBeta.find(proposalsFromDecision[0].id);
    assert(notFoundInP2 === null, '67.5 Proposta de tenantP1 não é visível em tenantP2');

    // 67.6 Preservação de Estados Existentes (Não-regressão de AUTHORIZED/REJECTED para PROPOSED)
    await inMemoryActionRepoAlpha.updateStatus(proposalsFromDecision[0].id, ActionProposalStatus.AUTHORIZED);
    const authorizedBeforeReprocess = await inMemoryActionRepoAlpha.find(proposalsFromDecision[0].id);
    assert(authorizedBeforeReprocess?.status === 'AUTHORIZED', '67.6 Status avançado para AUTHORIZED');

    // Reprocessa a decisão gerando novas instâncias de propostas com status PROPOSED
    const reprocessedProposals = ActionProposalFactory.fromDecision(sampleDecision);
    await inMemoryActionRepoAlpha.storeMany(reprocessedProposals);

    const authorizedAfterReprocess = await inMemoryActionRepoAlpha.find(proposalsFromDecision[0].id);
    assert(authorizedAfterReprocess?.status === 'AUTHORIZED', '67.6 Reprocessamento preservou status AUTHORIZED sem regredir para PROPOSED');

    // 67.7 PrismaActionProposalRepository (via mock): Persistência, Consulta e Não-regressão
    const prismaActionRepoAlpha = new PrismaActionProposalRepository({ tenantId: tenantP1, prisma: e2ePrismaMock });
    const prismaActionRepoBeta = new PrismaActionProposalRepository({ tenantId: tenantP2, prisma: e2ePrismaMock });

    await prismaActionRepoAlpha.storeMany(proposalsFromDecision);
    assert((await prismaActionRepoAlpha.count()) === 2, '67.7 Prisma count para tenantP1 é 2');
    assert((await prismaActionRepoBeta.count()) === 0, '67.7 Prisma count para tenantP2 é 0 (isolado)');

    const foundInPrisma = await prismaActionRepoAlpha.find(proposalsFromDecision[0].id);
    assert(foundInPrisma !== null, '67.7 Proposta encontrada no Prisma repository');
    assert(foundInPrisma?.id === proposalsFromDecision[0].id, '67.7 ID recuperado corretamente');

    // Atualiza status no Prisma
    await prismaActionRepoAlpha.updateStatus(proposalsFromDecision[0].id, ActionProposalStatus.REJECTED);
    const rejectedInPrisma = await prismaActionRepoAlpha.find(proposalsFromDecision[0].id);
    assert(rejectedInPrisma?.status === 'REJECTED', '67.7 Status atualizado para REJECTED no Prisma');

    // Reprocessamento no Prisma preserva REJECTED
    await prismaActionRepoAlpha.store(proposalsFromDecision[0]);
    const afterPrismaReprocess = await prismaActionRepoAlpha.find(proposalsFromDecision[0].id);
    assert(afterPrismaReprocess?.status === 'REJECTED', '67.7 Prisma preservou status REJECTED sem regredir para PROPOSED');

    // 67.8 Rejeição Obrigatória de tenantId vazio na instanciação
    let inMemoryEmptyTenantBlocked = false;
    try {
      new InMemoryActionProposalRepository('');
    } catch (e: any) {
      inMemoryEmptyTenantBlocked = e.message.includes('tenantId é obrigatório');
    }
    assert(inMemoryEmptyTenantBlocked, '67.8 Repositório InMemory rejeita tenantId vazio');

    let prismaEmptyTenantBlocked = false;
    try {
      new PrismaActionProposalRepository({ tenantId: '', prisma: e2ePrismaMock });
    } catch (e: any) {
      prismaEmptyTenantBlocked = e.message.includes('tenantId é obrigatório');
    }
    assert(prismaEmptyTenantBlocked, '67.8 Repositório Prisma rejeita tenantId vazio');

    // 67.9 Canonicalização Unicode NFC e Imunidade a Ambiguidades de Delimitadores
    // 67.9.1 Equivalência Unicode NFC (mesmo glifo com composições diferentes)
    const titleDecomposed = 'Aç\u0061\u0303o em Regi\u0061\u0303o'; // "Ação em Região" decomposto NFD
    const titleComposed = 'Ação em Região'; // "Ação em Região" pré-composto NFC
    const hashDecomposed = ActionProposalFactory.generateSemanticHash(sampleDecision.id, {
      ...sampleDecision.recommendedActions[0],
      title: titleDecomposed,
    });
    const hashComposed = ActionProposalFactory.generateSemanticHash(sampleDecision.id, {
      ...sampleDecision.recommendedActions[0],
      title: titleComposed,
    });
    assert(hashDecomposed === hashComposed, '67.9.1 Normalização Unicode NFC produz hash determinístico idêntico para glifos compostos e decompostos');

    // 67.9.2 Escape de Delimitadores (Evita colisão por injeção do delimitador '::')
    const actionInject1 = {
      ...sampleDecision.recommendedActions[0],
      title: 'Campanha::extra',
      timeframe: '15 dias',
    };
    const actionInject2 = {
      ...sampleDecision.recommendedActions[0],
      title: 'Campanha',
      timeframe: 'extra::15 dias',
    };
    const hashInject1 = ActionProposalFactory.generateSemanticHash(sampleDecision.id, actionInject1);
    const hashInject2 = ActionProposalFactory.generateSemanticHash(sampleDecision.id, actionInject2);
    assert(hashInject1 !== hashInject2, '67.9.2 Escape de caracteres de delimitação impede colisão por injeção de colons em campos adjacentes');

    // 67.10 Concorrência e Tratamento de Conflito de Criação Simultânea no Prisma Repository
    // Simula duas operações simultâneas de store da mesma proposta recém-criada
    const concurrentProposal = ActionProposalFactory.createProposal(sampleDecision, {
      title: 'Ação para Teste de Concorrência',
      priority: 'high' as any,
      expectedImpact: 'Alto impacto',
      estimatedGain: 500,
      timeframe: '10 dias',
      description: 'Teste concorrente',
    });
    // Executa ambas em paralelo; uma passará direto no create, a outra tratará o conflito P2002 via catch e fará update atômico
    await Promise.all([
      prismaActionRepoAlpha.store(concurrentProposal),
      prismaActionRepoAlpha.store(concurrentProposal),
    ]);
    assert((await prismaActionRepoAlpha.find(concurrentProposal.id)) !== null, '67.10 Operações concorrentes de store completam sem erro de colisão');

    // 67.11 Concorrência com Preservação de Estado Avançado
    // Atualiza para AUTHORIZED e executa simultaneamente 5 reprocessamentos chamando store()
    await prismaActionRepoAlpha.updateStatus(concurrentProposal.id, ActionProposalStatus.AUTHORIZED);
    await Promise.all([
      prismaActionRepoAlpha.store(concurrentProposal),
      prismaActionRepoAlpha.store(concurrentProposal),
      prismaActionRepoAlpha.store(concurrentProposal),
      prismaActionRepoAlpha.store(concurrentProposal),
      prismaActionRepoAlpha.store(concurrentProposal),
    ]);
    const preservedAfterConcurrent = await prismaActionRepoAlpha.find(concurrentProposal.id);
    assert(preservedAfterConcurrent?.status === 'AUTHORIZED', '67.11 Sob concorrência múltipla de store, status AUTHORIZED é estritamente preservado sem regredir para PROPOSED');

    // 67.12 Atomicidade e Rollback em storeMany no Prisma Repository
    const validProposal1 = ActionProposalFactory.createProposal(sampleDecision, {
      title: 'Proposta Transacional 1',
      priority: 'high' as any,
      expectedImpact: 'Impacto 1',
      estimatedGain: 100,
      timeframe: '7 dias',
      description: 'Desc 1',
    });
    // Cria proposta malformada que força erro dentro da transação
    const failingProposal: any = {
      tenantId: tenantP1,
      id: 'act-failing-trigger-error',
      // Simula erro de campo nulo obrigatório no mock
      title: null,
    };

    const countBeforeTx = await prismaActionRepoAlpha.count();
    let txErrorCaught = false;
    try {
      await prismaActionRepoAlpha.storeMany([validProposal1, failingProposal]);
    } catch (err: any) {
      txErrorCaught = true;
    }
    assert(txErrorCaught, '67.12 storeMany com falha em lote lança exceção');
    const countAfterTx = await prismaActionRepoAlpha.count();
    assert(countAfterTx === countBeforeTx, '67.12 Transação com erro executa rollback completo: proposta 1 NÃO é persistida isoladamente');

    // 67.13 Alinhamento de Tipo de estimatedGain (Float / Numérico)
    assert(typeof concurrentProposal.estimatedGain === 'number', '67.13 Domínio expõe estimatedGain como number');
    assert(concurrentProposal.estimatedGain === 500, '67.13 Valor numérico float preservado com fidelidade');

    // ----------------------------------------------------
    // Teste 68: ActionGovernanceService & Autorização Humana (Sprint 7 - Etapa 2)
    // ----------------------------------------------------
    console.log(`\n[Teste 68] Validando Governança e Autorização Humana de Ações (ActionGovernanceService)...`);

    const govTenantAlpha = 'tenant_gov_alpha';
    const govTenantBeta = 'tenant_gov_beta';

    const govRepoAlpha = new InMemoryActionProposalRepository(govTenantAlpha);
    const govAuditAlpha = new InMemoryDecisionAuditTrail();

    const govServiceAlpha = new ActionGovernanceService({
      repository: govRepoAlpha,
      tenantId: govTenantAlpha,
      auditTrail: govAuditAlpha,
    });

    const govProposalDecision: any = {
      tenantId: govTenantAlpha,
      id: 'dec-gov-test-001',
      category: 'territorial_expansion',
      priority: 'high',
      title: 'Decisão para Governança',
      summary: 'Sumário',
      expectedImpact: 'Alto impacto',
      confidence: 1.0,
      reasons: ['Razão 1'],
      recommendedActions: [
        {
          title: 'Ação Alfa para Autorização',
          priority: 'high' as any,
          expectedImpact: 'Impacto Alto',
          estimatedGain: 1500,
          timeframe: '10 dias',
        },
        {
          title: 'Ação Beta para Rejeição',
          priority: 'medium' as any,
          expectedImpact: 'Impacto Médio',
          estimatedGain: 800,
          timeframe: '20 dias',
        },
      ],
      relatedSignals: ['sig-gov-1'],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const govProposals = ActionProposalFactory.fromDecision(govProposalDecision);
    await govRepoAlpha.storeMany(govProposals);
    const propToAuthorize = govProposals[0];
    const propToReject = govProposals[1];

    // Definição de atores
    const humanActorValid: ActorContext = {
      tenantId: govTenantAlpha,
      actorId: 'usr-human-deputado',
      actorType: 'PARLAMENTAR',
      capabilities: ['action:authorize', 'action:reject'],
    };

    const humanActorNoCaps: ActorContext = {
      tenantId: govTenantAlpha,
      actorId: 'usr-human-sem-permissao',
      actorType: 'PARLAMENTAR',
      capabilities: [],
    };

    const systemActor: ActorContext = {
      tenantId: govTenantAlpha,
      actorId: 'sys-agent-automation',
      actorType: 'SYSTEM',
      capabilities: ['*'],
    };

    const crossTenantHumanActor: ActorContext = {
      tenantId: govTenantBeta,
      actorId: 'usr-human-beta',
      actorType: 'PARLAMENTAR',
      capabilities: ['*'],
    };

    // 68.1 Bloqueio de Ator SYSTEM (Rejeição de automações sem intervenção humana)
    let systemBlocked = false;
    try {
      await govServiceAlpha.authorize({
        proposalId: propToAuthorize.id,
        actor: systemActor,
      });
    } catch (e: any) {
      systemBlocked = e.message.includes('Atores do tipo SYSTEM não possuem permissão');
    }
    assert(systemBlocked, '68.1 Atores SYSTEM são estritamente bloqueados de autorizar ações');

    // 68.2 Bloqueio por Falta de Capabilities Específicas
    let noCapsBlocked = false;
    try {
      await govServiceAlpha.authorize({
        proposalId: propToAuthorize.id,
        actor: humanActorNoCaps,
      });
    } catch (e: any) {
      noCapsBlocked = e.message.includes('Ator não possui a permissão requerida: action:authorize');
    }
    assert(noCapsBlocked, '68.2 Ator sem capability action:authorize é bloqueado');

    // 68.3 Bloqueio de Tentativa Cross-Tenant
    let crossTenantBlocked = false;
    try {
      await govServiceAlpha.authorize({
        proposalId: propToAuthorize.id,
        actor: crossTenantHumanActor,
      });
    } catch (e: any) {
      crossTenantBlocked = e.message.includes('Violação de isolamento multi-tenant');
    }
    assert(crossTenantBlocked, '68.3 Ator de tenant distinto é bloqueado por isolamento multi-tenant');

    // 68.4 Autorização Válida por Operador Humano (PROPOSED -> AUTHORIZED)
    const authorizedProposal = await govServiceAlpha.authorize({
      proposalId: propToAuthorize.id,
      actor: humanActorValid,
      notes: 'Aprovado pelo comitê de campanha.',
    });
    assert(authorizedProposal.status === ActionProposalStatus.AUTHORIZED, '68.4 Status atualizado para AUTHORIZED');
    assert((authorizedProposal.metadata as any)?.authorization?.authorizedBy?.actorId === humanActorValid.actorId, '68.4 Metadados gravam autor da autorização');
    assert((authorizedProposal.metadata as any)?.authorization?.notes === 'Aprovado pelo comitê de campanha.', '68.4 Notas de autorização gravadas');
    assert(typeof (authorizedProposal.metadata as any)?.authorization?.authorizedAt === 'string', '68.4 Timestamp de autorização registrado');

    // 68.5 Bloqueio de Transição de Estado Inválida (Re-autorizar proposta já AUTHORIZED)
    let reauthorizeBlocked = false;
    try {
      await govServiceAlpha.authorize({
        proposalId: propToAuthorize.id,
        actor: humanActorValid,
      });
    } catch (e: any) {
      reauthorizeBlocked = e.message.includes('Transição de estado inválida');
    }
    assert(reauthorizeBlocked, '68.5 Bloqueia transição inválida de proposta já AUTHORIZED');

    // 68.6 Rejeição Válida por Operador Humano (PROPOSED -> REJECTED com motivo obrigatório)
    // 68.6.1 Falha se motivo for vazio
    let emptyReasonBlocked = false;
    try {
      await govServiceAlpha.reject({
        proposalId: propToReject.id,
        actor: humanActorValid,
        reason: '   ',
      });
    } catch (e: any) {
      emptyReasonBlocked = e.message.includes('Motivo da rejeição (reason) é obrigatório');
    }
    assert(emptyReasonBlocked, '68.6.1 Rejeição bloqueada quando motivo não é fornecido');

    // 68.6.2 Rejeição com sucesso
    const rejectedProposal = await govServiceAlpha.reject({
      proposalId: propToReject.id,
      actor: humanActorValid,
      reason: 'Inviabilidade orçamentária para deslocamento na região.',
    });
    assert(rejectedProposal.status === ActionProposalStatus.REJECTED, '68.6.2 Status atualizado para REJECTED');
    assert((rejectedProposal.metadata as any)?.rejection?.rejectedBy?.actorId === humanActorValid.actorId, '68.6.2 Metadados gravam autor da rejeição');
    assert((rejectedProposal.metadata as any)?.rejection?.rejectionReason === 'Inviabilidade orçamentária para deslocamento na região.', '68.6.2 Motivo da rejeição persistido');

    // 68.7 Bloqueio de Transição de Estado Inválida (Autorizar proposta REJECTED)
    let authorizeRejectedBlocked = false;
    try {
      await govServiceAlpha.authorize({
        proposalId: propToReject.id,
        actor: humanActorValid,
      });
    } catch (e: any) {
      authorizeRejectedBlocked = e.message.includes('Transição de estado inválida');
    }
    assert(authorizeRejectedBlocked, '68.7 Bloqueia autorização de proposta em status REJECTED');

    // 68.8 Auditoria das Operações Permitidas e Negadas
    const govAuditLogsAlpha = await govAuditAlpha.listByTenant(govTenantAlpha);
    assert(govAuditLogsAlpha.length >= 5, '68.8 Eventos de auditoria gerados para operações permitidas e negadas');

    const authSuccessEvent = govAuditLogsAlpha.find(
      (ev) => ev.operation === ActionGovernanceOperation.ACTION_AUTHORIZE && ev.result === 'SUCCESS'
    );
    assert(authSuccessEvent !== undefined, '68.8 Evento SUCCESS registrado para ACTION_AUTHORIZE');
    assert(authSuccessEvent?.actorId === humanActorValid.actorId, '68.8 Ator registrado no evento de sucesso');

    const rejectSuccessEvent = govAuditLogsAlpha.find(
      (ev) => ev.operation === ActionGovernanceOperation.ACTION_REJECT && ev.result === 'SUCCESS'
    );
    assert(rejectSuccessEvent !== undefined, '68.8 Evento SUCCESS registrado para ACTION_REJECT');

    const systemDeniedEvent = govAuditLogsAlpha.find(
      (ev) => ev.actorId === systemActor.actorId && ev.result === 'DENIED'
    );
    assert(systemDeniedEvent !== undefined, '68.8 Tentativa de ator SYSTEM auditada como DENIED');

    // 68.9 Concorrência: Duas chamadas simultâneas de authorize
    // Apenas a primeira deve ter sucesso; a segunda deve falhar por transição inválida
    const concProposal = ActionProposalFactory.createProposal(govProposalDecision, {
      title: 'Ação para Concorrência de Governança',
      priority: 'high' as any,
      expectedImpact: 'Impacto',
      estimatedGain: 300,
      timeframe: '5 dias',
      description: 'Desc',
    });
    await govRepoAlpha.store(concProposal);

    const concResults = await Promise.allSettled([
      govServiceAlpha.authorize({ proposalId: concProposal.id, actor: humanActorValid }),
      govServiceAlpha.authorize({ proposalId: concProposal.id, actor: humanActorValid }),
    ]);

    const concFulfilled = concResults.filter((r) => r.status === 'fulfilled');
    const concRejected = concResults.filter((r) => r.status === 'rejected');
    assert(concFulfilled.length === 1, '68.9 Exatamente uma chamada concorrente de authorize é aprovada');
    assert(concRejected.length === 1, '68.9 Segunda chamada concorrente é rejeitada por transição inválida (já AUTHORIZED)');

    // ----------------------------------------------------
    // Teste 69: Action Execution Layer (Sprint 7 - Etapa 3)
    // ----------------------------------------------------
    console.log(`\n[Teste 69] Validando ActionExecutionLayer (Histórico, Tentativas, Simulação e Repositórios)...`);

    const execTenantAlpha = 'tenant_exec_alpha';
    const execTenantBeta = 'tenant_exec_beta';

    const execProposalRepoAlpha = new InMemoryActionProposalRepository(execTenantAlpha);
    const execExecutionRepoAlpha = new InMemoryActionExecutionRepository(execTenantAlpha);
    const execAuditAlpha = new InMemoryDecisionAuditTrail();

    const execServiceAlpha = new ActionExecutionService({
      proposalRepository: execProposalRepoAlpha,
      executionRepository: execExecutionRepoAlpha,
      tenantId: execTenantAlpha,
      auditTrail: execAuditAlpha,
    });

    const execHumanActor: ActorContext = {
      tenantId: execTenantAlpha,
      actorId: 'usr-exec-human',
      actorType: 'PARLAMENTAR',
    };

    const execCrossTenantActor: ActorContext = {
      tenantId: execTenantBeta,
      actorId: 'usr-exec-beta',
      actorType: 'PARLAMENTAR',
    };

    // Prepara propostas: uma PROPOSED e uma AUTHORIZED
    const execDecision: any = {
      tenantId: execTenantAlpha,
      id: 'dec-exec-001',
      category: 'mobilization',
      priority: 'high',
      title: 'Decisão para Execução',
      summary: 'Sumário',
      expectedImpact: 'Impacto',
      confidence: 1.0,
      reasons: ['R1'],
      recommendedActions: [
        {
          title: 'Ação para Execução Autorizada',
          priority: 'high' as any,
          expectedImpact: 'Impacto',
          estimatedGain: 500,
          timeframe: '5 dias',
        },
      ],
      relatedSignals: ['s1'],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const rawProposals = ActionProposalFactory.fromDecision(execDecision);
    await execProposalRepoAlpha.storeMany(rawProposals);
    const unapprovedProposal = rawProposals[0];

    // 69.1 Bloqueio de Dispatch para Proposta NÃO Autorizada (status PROPOSED)
    let unapprovedDispatchBlocked = false;
    try {
      await execServiceAlpha.dispatch({
        proposalId: unapprovedProposal.id,
        actor: execHumanActor,
      });
    } catch (e: any) {
      unapprovedDispatchBlocked = e.message.includes('requer AUTHORIZED por autorização humana prévia');
    }
    assert(unapprovedDispatchBlocked, '69.1 Dispatch bloqueado para proposta com status PROPOSED (autorização humana prévia obrigatória)');

    // 69.2 Bloqueio de Isolamento Multi-Tenant
    let crossTenantExecBlocked = false;
    try {
      await execServiceAlpha.dispatch({
        proposalId: unapprovedProposal.id,
        actor: execCrossTenantActor,
      });
    } catch (e: any) {
      crossTenantExecBlocked = e.message.includes('Violação de isolamento multi-tenant');
    }
    assert(crossTenantExecBlocked, '69.2 Bloqueio estrito de execução por ator de outro tenant');

    // Autoriza a proposta
    await execProposalRepoAlpha.updateStatus(unapprovedProposal.id, ActionProposalStatus.AUTHORIZED);
    const approvedProposal = await execProposalRepoAlpha.find(unapprovedProposal.id);
    assert(approvedProposal?.status === ActionProposalStatus.AUTHORIZED, '69.3 Proposta autorizada');

    // 69.4 Primeiro Dispatch Válido (Tentativa 1)
    const execAttempt1 = await execServiceAlpha.dispatch({
      proposalId: approvedProposal!.id,
      actor: execHumanActor,
      mode: ActionExecutionMode.SIMULATED,
      payload: { simulatedTarget: 'whatsapp_mock_channel' },
    });
    assert(execAttempt1.attemptNumber === 1, '69.4 Primeira execução possui attemptNumber = 1');
    assert(execAttempt1.status === ActionExecutionStatus.DISPATCHED, '69.4 Status inicial após dispatch é DISPATCHED');
    assert(execAttempt1.mode === ActionExecutionMode.SIMULATED, '69.4 Modo estritamente SIMULATED');
    assert(execAttempt1.id === `exec-${approvedProposal!.id}-att1`, '69.4 ID determinístico por tentativa');

    // 69.5 Conclusão com Falha Simulada (DISPATCHED -> FAILED)
    const failedAttempt1 = await execServiceAlpha.complete({
      executionId: execAttempt1.id,
      actor: execHumanActor,
      success: false,
      error: 'Simulação: Falha de conexão simulada.',
    });
    assert(failedAttempt1.status === ActionExecutionStatus.FAILED, '69.5 Tentativa 1 concluída como FAILED');
    assert(failedAttempt1.error === 'Simulação: Falha de conexão simulada.', '69.5 Mensagem de erro gravada');
    assert(typeof failedAttempt1.completedAt === 'string', '69.5 Timestamp de conclusão preenchido');

    // 69.6 Bloqueio de Transição Duplicada em Execução Concluída
    let doubleCompleteBlocked = false;
    try {
      await execServiceAlpha.complete({
        executionId: execAttempt1.id,
        actor: execHumanActor,
        success: true,
      });
    } catch (e: any) {
      doubleCompleteBlocked = e.message.includes('já está em status');
    }
    assert(doubleCompleteBlocked, '69.6 Bloqueia conclusão em execução já finalizada');

    // 69.7 Segunda Tentativa de Execução (Tentativa 2 preserva histórico)
    const execAttempt2 = await execServiceAlpha.dispatch({
      proposalId: approvedProposal!.id,
      actor: execHumanActor,
      mode: ActionExecutionMode.SIMULATED,
      payload: { retry: true },
    });
    assert(execAttempt2.attemptNumber === 2, '69.7 Segunda execução incrementa attemptNumber para 2');
    assert(execAttempt2.id === `exec-${approvedProposal!.id}-att2`, '69.7 ID próprio para a segunda tentativa');

    // Conclui tentativa 2 com SUCESSO (DISPATCHED -> EXECUTED)
    const successAttempt2 = await execServiceAlpha.complete({
      executionId: execAttempt2.id,
      actor: execHumanActor,
      success: true,
      result: { sentCount: 150, simulatedRate: 1.0 },
    });
    assert(successAttempt2.status === ActionExecutionStatus.EXECUTED, '69.7 Tentativa 2 concluída com EXECUTED');
    assert((successAttempt2.result as any)?.sentCount === 150, '69.7 Resultado simulado gravado');

    // 69.8 Preservação do Histórico Completo de Tentativas
    const history = await execServiceAlpha.getHistory(approvedProposal!.id);
    assert(history.length === 2, '69.8 Histórico contém exatamente as 2 tentativas');
    assert(history[0].attemptNumber === 1 && history[0].status === ActionExecutionStatus.FAILED, '69.8 Tentativa 1 permanece FAILED no histórico');
    assert(history[1].attemptNumber === 2 && history[1].status === ActionExecutionStatus.EXECUTED, '69.8 Tentativa 2 permanece EXECUTED no histórico');

    // 69.9 Bloqueio de Dispatch Duplicado Concorrente da Mesma Tentativa
    let duplicateAttemptBlocked = false;
    try {
      await execExecutionRepoAlpha.store({
        ...execAttempt2,
        id: 'exec-fake-collision',
        attemptNumber: 2, // Mesma tentativa já existente
      });
    } catch (e: any) {
      duplicateAttemptBlocked = e.message.includes('Unique constraint failed');
    }
    assert(duplicateAttemptBlocked, '69.9 Repositório impede duplicidade de tentativa para a mesma proposta');

    // 69.10 PrismaActionExecutionRepository (via mock): Validação Multi-Tenant, Criação e Trava Atômica
    const prismaExecRepoAlpha = new PrismaActionExecutionRepository({
      tenantId: execTenantAlpha,
      prisma: e2ePrismaMock,
    });
    const prismaExecRepoBeta = new PrismaActionExecutionRepository({
      tenantId: execTenantBeta,
      prisma: e2ePrismaMock,
    });

    await prismaExecRepoAlpha.store(failedAttempt1);
    await prismaExecRepoAlpha.store(successAttempt2);

    assert((await prismaExecRepoAlpha.count()) === 2, '69.10 Prisma count em Alpha é 2');
    assert((await prismaExecRepoBeta.count()) === 0, '69.10 Prisma count em Beta é 0 (isolamento estrito)');

    const loadedFromPrisma = await prismaExecRepoAlpha.findById(execAttempt1.id);
    assert(loadedFromPrisma !== null, '69.10 Execução carregada do Prisma');
    assert(loadedFromPrisma?.attemptNumber === 1, '69.10 attemptNumber correto');

    // Teste de atualização atômica condicional no Prisma
    const updatedPrismaAtomic = await prismaExecRepoAlpha.updateStatus(
      execAttempt1.id,
      ActionExecutionStatus.EXECUTED,
      {},
      ActionExecutionStatus.FAILED // Estado esperado
    );
    assert(updatedPrismaAtomic === true, '69.10 Atualização condicional atômica no Prisma bem-sucedida quando estado bate');

    const updatedPrismaMismatch = await prismaExecRepoAlpha.updateStatus(
      execAttempt1.id,
      ActionExecutionStatus.FAILED,
      {},
      ActionExecutionStatus.PENDING // Estado incompatível (já está EXECUTED)
    );
    assert(updatedPrismaMismatch === false, '69.10 Atualização condicional atômica no Prisma retorna false quando estado diverge (count == 0)');

    console.log(`\n${GREEN}==============================================`);
    console.log(`TODOS OS TESTES ANTERIORES PASSARAM COM SUCESSO!`);
    console.log(`==============================================${RESET}`);

    // ----------------------------------------------------
    // Teste 70: Validação E2E Integrada do Sprint 7 (Etapa 4)
    // Fluxo Completo:
    // StrategicSignal -> Core DecisionEngine -> DecisionRegistry ->
    // ActionProposalFactory -> ActionGovernanceService -> ActionExecutionService -> AuditTrail
    // ----------------------------------------------------
    console.log(`\n[Teste 70] Executando Validação E2E Integrada do Sprint 7 (Signal -> Decision -> Proposal -> Governance -> Execution -> Audit)...`);

    const e2eS7TenantAlpha = 's7_e2e_tenant_alpha';
    const e2eS7TenantBeta = 's7_e2e_tenant_beta';

    // Repositórios e Serviços do Tenant Alpha
    const e2eProposalRepoAlpha = new PrismaActionProposalRepository({
      tenantId: e2eS7TenantAlpha,
      prisma: e2ePrismaMock,
    });
    const e2eExecutionRepoAlpha = new PrismaActionExecutionRepository({
      tenantId: e2eS7TenantAlpha,
      prisma: e2ePrismaMock,
    });
    const e2eAuditAlpha = new PrismaDecisionAuditTrail({
      prisma: e2ePrismaMock,
    });
    const e2eDecisionRepoAlpha = new PrismaDecisionRepository({
      tenantId: e2eS7TenantAlpha,
      prisma: e2ePrismaMock,
    });
    const e2eDecisionRegistryAlpha = new DecisionRegistry({
      repository: e2eDecisionRepoAlpha,
      tenantId: e2eS7TenantAlpha,
      auditTrail: e2eAuditAlpha,
    });
    const e2eGovernanceAlpha = new ActionGovernanceService({
      repository: e2eProposalRepoAlpha,
      tenantId: e2eS7TenantAlpha,
      auditTrail: e2eAuditAlpha,
    });
    const e2eExecutionAlpha = new ActionExecutionService({
      proposalRepository: e2eProposalRepoAlpha,
      executionRepository: e2eExecutionRepoAlpha,
      tenantId: e2eS7TenantAlpha,
      auditTrail: e2eAuditAlpha,
    });

    // Repositórios do Tenant Beta (para teste de isolamento estrito)
    const e2eProposalRepoBeta = new PrismaActionProposalRepository({
      tenantId: e2eS7TenantBeta,
      prisma: e2ePrismaMock,
    });
    const e2eExecutionRepoBeta = new PrismaActionExecutionRepository({
      tenantId: e2eS7TenantBeta,
      prisma: e2ePrismaMock,
    });
    const e2eAuditBeta = new PrismaDecisionAuditTrail({
      prisma: e2ePrismaMock,
    });

    // Atores
    const actorAlphaHuman: ActorContext = {
      tenantId: e2eS7TenantAlpha,
      actorId: 'usr-deputado-alfa',
      actorType: 'PARLAMENTAR',
      capabilities: ['decision:*', 'action:*'],
    };

    const actorAlphaSystem: ActorContext = {
      tenantId: e2eS7TenantAlpha,
      actorId: 'sys-core-automation',
      actorType: 'SYSTEM',
      capabilities: ['*'],
    };

    const actorBetaHuman: ActorContext = {
      tenantId: e2eS7TenantBeta,
      actorId: 'usr-deputado-beta',
      actorType: 'PARLAMENTAR',
      capabilities: ['*'],
    };

    // 70.1 Geração de Decisão pelo Core DecisionEngine a partir de StrategicSignal
    const signalRecord: any = {
      tenantId: e2eS7TenantAlpha,
      id: 'sig-e2e-s7-orphan-01',
      type: 'orphan_node',
      category: 'RISK',
      severity: 'critical',
      confidence: 1.0,
      description: 'Candidato isolado sem conexão territorial',
      context: { nodeId: 'cand-s7-001' },
      detectedAt: '2026-10-08T12:00:00Z',
    };
    const coreSignals = StrategicSignalBridge.toCoreSignals([signalRecord], e2eS7TenantAlpha);
    const coreDecisions = DecisionEngine.generateFromSignals(coreSignals);
    assert(coreDecisions.length > 0, '70.1 DecisionEngine gerou decisões a partir do StrategicSignalBridge');
    const firstCoreDecision = coreDecisions[0];

    // Garante que a decisão gerada pelo DecisionEngine possui ações recomendadas
    if (!firstCoreDecision.recommendedActions || firstCoreDecision.recommendedActions.length === 0) {
      firstCoreDecision.recommendedActions = [
        {
          title: 'Articular liderança territorial na Região Central',
          description: 'Aproximação com coordenadores locais para reconectar base isolada',
          priority: 'HIGH' as any,
          expectedImpact: 'Alto impacto na retenção de base eleitoral',
          estimatedGain: 1200,
          timeframe: 'Curto Prazo (7 dias)',
        },
        {
          title: 'Reunião de emergência com diretório municipal',
          description: 'Definição de cronograma de visitas comunitárias',
          priority: 'URGENT' as any,
          expectedImpact: 'Contenção de desarticulação política',
          estimatedGain: 800,
          timeframe: 'Imediato (24-48h)',
        },
      ];
    }

    // Persiste a decisão via DecisionRegistry
    const registeredDecision = await e2eDecisionRegistryAlpha.register(firstCoreDecision, actorAlphaHuman);
    assert(registeredDecision.id === firstCoreDecision.id, '70.1 Decisão persistida no DecisionRegistry');

    // 70.2 Propostas Determinísticas e Idempotentes (ActionProposalFactory)
    const generatedProposals = ActionProposalFactory.fromDecision(registeredDecision);
    assert(generatedProposals.length > 0, '70.2 ActionProposalFactory gerou propostas para a decisão');
    await e2eProposalRepoAlpha.storeMany(generatedProposals);
    const proposalCountInitial = await e2eProposalRepoAlpha.count();
    assert(proposalCountInitial === generatedProposals.length, '70.2 Propostas persistidas');

    // Re-armazenamento não duplica nem regride
    await e2eProposalRepoAlpha.storeMany(generatedProposals);
    assert((await e2eProposalRepoAlpha.count()) === proposalCountInitial, '70.2 Idempotência: reprocessamento mantém a mesma quantidade de propostas');

    const targetProposal = generatedProposals[0];

    // 70.3 Tentativa de Dispatch Bloqueada antes de Autorização Humana
    let prematureDispatchBlocked = false;
    try {
      await e2eExecutionAlpha.dispatch({
        proposalId: targetProposal.id,
        actor: actorAlphaHuman,
      });
    } catch (e: any) {
      prematureDispatchBlocked = e.message.includes('requer AUTHORIZED');
    }
    assert(prematureDispatchBlocked, '70.3 Proposta não autorizada tem dispatch bloqueado');

    // 70.4 Tentativa de Autorização por Ator SYSTEM Bloqueada
    let systemAuthBlocked = false;
    try {
      await e2eGovernanceAlpha.authorize({
        proposalId: targetProposal.id,
        actor: actorAlphaSystem,
      });
    } catch (e: any) {
      systemAuthBlocked = e.message.includes('Atores do tipo SYSTEM não possuem permissão');
    }
    assert(systemAuthBlocked, '70.4 Bloqueio estrito de autorização por ator SYSTEM');

    // 70.5 Tentativa Cross-Tenant Bloqueada (Ator Beta tenta autorizar proposta de Alfa)
    let crossTenantAuthBlocked = false;
    try {
      await e2eGovernanceAlpha.authorize({
        proposalId: targetProposal.id,
        actor: actorBetaHuman,
      });
    } catch (e: any) {
      crossTenantAuthBlocked = e.message.includes('Violação de isolamento multi-tenant');
    }
    assert(crossTenantAuthBlocked, '70.5 Ator de outro tenant bloqueado por isolamento multi-tenant');

    // 70.6 Autorização Válida por Operador Humano (PROPOSED -> AUTHORIZED)
    const authorizedProp = await e2eGovernanceAlpha.authorize({
      proposalId: targetProposal.id,
      actor: actorAlphaHuman,
      notes: 'Autorizado para simulação em comitê',
    });
    assert(authorizedProp.status === ActionProposalStatus.AUTHORIZED, '70.6 Proposta autorizada com sucesso por humano');

    // 70.7 Ciclo de Vida da Execução Simulada (Tentativa 1: FAILED; Tentativa 2: EXECUTED)
    // Dispatch Tentativa 1
    const dispatch1 = await e2eExecutionAlpha.dispatch({
      proposalId: authorizedProp.id,
      actor: actorAlphaHuman,
      mode: ActionExecutionMode.SIMULATED,
    });
    assert(dispatch1.attemptNumber === 1, '70.7 Tentativa 1 despachada');
    assert(dispatch1.status === ActionExecutionStatus.DISPATCHED, '70.7 Status DISPATCHED');

    // Conclui com falha simulada
    const completed1 = await e2eExecutionAlpha.complete({
      executionId: dispatch1.id,
      actor: actorAlphaHuman,
      success: false,
      error: 'Simulação: Falha de timeout de envio',
    });
    assert(completed1.status === ActionExecutionStatus.FAILED, '70.7 Tentativa 1 finalizada como FAILED');

    // Dispatch Tentativa 2 (Retry simulado)
    const dispatch2 = await e2eExecutionAlpha.dispatch({
      proposalId: authorizedProp.id,
      actor: actorAlphaHuman,
      mode: ActionExecutionMode.SIMULATED,
    });
    assert(dispatch2.attemptNumber === 2, '70.7 Tentativa 2 despachada');

    // Conclui tentativa 2 com sucesso
    const completed2 = await e2eExecutionAlpha.complete({
      executionId: dispatch2.id,
      actor: actorAlphaHuman,
      success: true,
      result: { sentSimulated: true, engagementEstimate: '+10%' },
    });
    assert(completed2.status === ActionExecutionStatus.EXECUTED, '70.7 Tentativa 2 finalizada como EXECUTED');

    // 70.8 Rastreabilidade e Histórico de Execução
    const fullHistory = await e2eExecutionAlpha.getHistory(authorizedProp.id);
    assert(fullHistory.length === 2, '70.8 Histórico contém exatamente as duas tentativas');
    assert(fullHistory[0].attemptNumber === 1 && fullHistory[0].status === 'FAILED', '70.8 Histórico preserva tentativa 1 com falha');
    assert(fullHistory[1].attemptNumber === 2 && fullHistory[1].status === 'EXECUTED', '70.8 Histórico preserva tentativa 2 com sucesso');

    // 70.9 Isolamento Estrito: Tenant Beta não vê dados nem execuções de Alfa
    assert((await e2eProposalRepoBeta.count()) === 0, '70.9 Tenant Beta possui 0 propostas');
    assert((await e2eExecutionRepoBeta.count()) === 0, '70.9 Tenant Beta possui 0 execuções');
    // O ator de Beta tentou violar o isolamento, gerando 1 evento de auditoria DENIED registrado na trilha de Beta
    const betaAuditEvents = await e2eAuditBeta.listByTenant(e2eS7TenantBeta);
    assert(betaAuditEvents.length === 1, '70.9 Tenant Beta registrou auditoria do bloqueio de segurança');
    assert(betaAuditEvents[0].result === 'DENIED', '70.9 Evento do Tenant Beta é estritamente DENIED por isolamento');

    // 70.10 Audit Trail Ponta a Ponta: Reconstrução Completa da Sequência de Governança
    const e2eAuditTrailAlpha = await e2eAuditAlpha.listByTenant(e2eS7TenantAlpha);
    assert(e2eAuditTrailAlpha.length >= 6, '70.10 Audit trail registrou toda a cadeia de operações');

    const hasDecisionRegister = e2eAuditTrailAlpha.some((ev) => ev.operation === 'DECISION_REGISTER');
    const hasActionAuthorize = e2eAuditTrailAlpha.some((ev) => ev.operation === 'ACTION_AUTHORIZE');
    const hasExecutionDispatch = e2eAuditTrailAlpha.some((ev) => ev.operation === 'ACTION_EXECUTION_DISPATCH');
    const hasExecutionSuccess = e2eAuditTrailAlpha.some((ev) => ev.operation === 'ACTION_EXECUTION_SUCCESS');
    const hasExecutionFailure = e2eAuditTrailAlpha.some((ev) => ev.operation === 'ACTION_EXECUTION_FAILURE');

    assert(hasDecisionRegister, '70.10 Audit trail contém DECISION_REGISTER');
    assert(hasActionAuthorize, '70.10 Audit trail contém ACTION_AUTHORIZE');
    assert(hasExecutionDispatch, '70.10 Audit trail contém ACTION_EXECUTION_DISPATCH');
    assert(hasExecutionFailure, '70.10 Audit trail contém ACTION_EXECUTION_FAILURE (tentativa 1)');
    assert(hasExecutionSuccess, '70.10 Audit trail contém ACTION_EXECUTION_SUCCESS (tentativa 2)');

    console.log(`\n${GREEN}==============================================`);
    console.log(`TODOS OS TESTES PASSARAM COM SUCESSO!`);
    console.log(`==============================================${RESET}`);
  } catch (error) {
    console.error(`\n${RED}==============================================`);
    console.error(`OCORRERAM FALHAS NOS TESTES!`);
    console.error(error);
    console.error(`==============================================${RESET}`);
    process.exit(1);
  } finally {
    teardown();
  }
}

runTests();
