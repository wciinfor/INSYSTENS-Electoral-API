# INSYSTENS CORE - Manual dos Componentes do Núcleo

Este documento detalha todos os componentes pertencentes ao **INSYSTENS CORE**, especificando seus objetivos, responsabilidades e restrições de acoplamento.

> [!IMPORTANT]
> **REGRA DE OURO**: "O CORE é congelado e deve sofrer o mínimo possível de alterações." Toda nova funcionalidade deve ser adicionada fora dele, através de extensões e adapters.

---

## 1. ContextProvider
* **Objetivo**: Unificar a leitura e resolução do perfil político da conta.
* **Responsabilidades**: Agregar os dados operacionais (`Account`, `PoliticalProfile`, `ElectionInterest`, `AutomaticFilter`) e preparar os parâmetros e filtros geográficos.
* **Dependências Permitidas**: Prisma Client (apenas para carregar o estado inicial da conta), tipagens compartilhadas.
* **Dependências Proibidas**: Lógica analítica do Kernel, IA, repositórios de dados agregados.

## 2. Strategic Intelligence Kernel (SIK)
* **Objetivo**: Motor analítico central que orquestra a geração de insights e pontuações do político.
* **Responsabilidades**: Executar o pipeline estratégico e agregar as análises estruturadas.
* **Dependências Permitidas**: `ScoreRegistry`, `AIContextBuilder`, `ExecutiveSummaryBuilder`, `IntelligenceRepository` (Interface).
* **Dependências Proibidas**: Prisma Client, queries SQL, drivers específicos de banco de dados, APIs de IA de terceiros.

## 3. ScoreRegistry
* **Objetivo**: Gerenciar e registrar motores de pontuação (Score Engines).
* **Responsabilidades**: Manter a lista de engines (`TCS`, `GOS`, `PRS`, `ISI`) e disparar o cálculo unificado.
* **Dependências Permitidas**: `ScoreEngine` interface.
* **Dependências Proibidas**: Conexão com banco de dados, regras específicas de planos.

## 4. RepositoryRegistry & RepositoryFactory
* **Objetivo**: Resolver e instanciar dinamicamente a fonte de dados analíticos ativos.
* **Responsabilidades**: Registrar as implementações físicas e fornecer a instância sob demanda baseando-se em configurações de ambiente.
* **Dependências Permitidas**: `IntelligenceRepository` interface, importações das implementações locais.
* **Dependências Proibidas**: Lógica do SIK.

## 5. FeatureFlags & ProductPlans
* **Objetivo**: Declarar as chaves de recursos e as matrizes de planos comerciais da plataforma.
* **Responsabilidades**: Guardar as constantes estáticas de planos (`STARTER`, `PRO`, `PREMIUM`, etc.) e flags disponíveis.
* **Dependências Permitidas**: Nenhuma (arquivo puro de definições).
* **Dependências Proibidas**: Banco de dados, serviços de autenticação.

## 6. LicenseService & FeatureFlagService
* **Objetivo**: Validar acessos comerciais de recursos e capabilities do tenant ativo.
* **Responsabilidades**: Responder se uma funcionalidade está ativa e mapear as flags comerciais em `Capabilities` operacionais.
* **Dependências Permitidas**: `ProductPlans`, `Capability` interface.
* **Dependências Proibidas**: Lógica analítica de votos, consultas de banco de dados operacionais.

## 7. AIContextBuilder & ExecutiveSummaryBuilder
* **Objetivo**: Traduzir métricas numéricas e contextos geográficos em strings limpas e metadados estruturados.
* **Responsabilidades**: Formatar o sumário executivo em parágrafos e construir o payload de IA pronto para envio para LLMs.
* **Dependências Permitidas**: `ElectoralContext`, `ScoreResult` interface.
* **Dependências Proibidas**: Acesso a servidores de LLM externos, consultas a banco de dados.
