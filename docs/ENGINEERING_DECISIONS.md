# INSYSTENS CORE - Registro de Decisões de Engenharia (ADRs)

Este documento registra as decisões arquiteturais fundamentais adotadas no desenvolvimento da plataforma **INSYSTENS Electoral Intelligence**.

---

## ADR-0001: CORE Congelado
* **Status**: Aprovado
* **Contexto**: Alterações frequentes no núcleo do sistema podem induzir regressões e instabilidades em deploys multi-tenant.
* **Decisão**: A pasta `src/core/` é considerada congelada e deve sofrer o mínimo de modificações. Qualquer evolução deve ocorrer via extensões e adapters externos.

## ADR-0002: Repository Pattern Obrigatório (IRL)
* **Status**: Aprovado
* **Contexto**: A lógica estratégica analítica do Kernel (SIK) deve ser protegida de mudanças em ORMs ou drivers de dados.
* **Decisão**: Toda leitura e persistência na camada analítica do Kernel deve ocorrer exclusivamente através da interface `IntelligenceRepository`.

## ADR-0003: Provider Pattern Obrigatório
* **Status**: Aprovado
* **Contexto**: A necessidade de trocar a fonte física de dados (PostgreSQL, ClickHouse, Data Lake) de forma indolor e sem reescrever o Kernel.
* **Decisão**: A criação de instâncias de repositórios deve ocorrer de forma opaca pela `RepositoryFactory` e `RepositoryRegistry` usando variáveis de ambiente.

## ADR-0004: Political Knowledge Graph Independente de Tecnologia
* **Status**: Aprovado
* **Contexto**: Integrar Neo4j ou bancos de grafos externos eleva a complexidade de infraestrutura para desenvolvedores e infra local.
* **Decisão**: O grafo político (PKG) deve ser desenvolvido em TypeScript nativo e persistido em estruturas de memória pura nesta fase do projeto.

## ADR-0005: Strategic Domain Models Obrigatórios
* **Status**: Aprovado
* **Contexto**: A propagação de dados fracamente tipados e JSONs livres no sistema dificulta refatorações e gera acoplamentos.
* **Decisão**: A comunicação entre camadas (Kernel, API, simulador, gerador de relatórios) deve utilizar exclusivamente as classes e interfaces de `Strategic Domain Models`.

## ADR-0006: Kernel Desacoplado do Banco de Dados
* **Status**: Aprovado
* **Contexto**: Evitar dependências pesadas e manter o Kernel SIK puro, testável localmente e performático.
* **Decisão**: O `KernelPipeline` nunca inicializa o Prisma Client ou faz consultas SQL. Ele recebe apenas os dados analíticos de forma assíncrona do repositório injetado.

## ADR-0007: Feature Flags Desacopladas do Kernel
* **Status**: Aprovado
* **Contexto**: O Kernel de Inteligência não deve conhecer as regras contratuais ou planos comerciais do cliente de forma direta.
* **Decisão**: O Kernel apenas consulta o `FeatureFlagService` ou `LicenseService` de forma transparente para liberar recursos, mantendo a responsabilidade de precificação e licenciamento externa.
