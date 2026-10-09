# INSYSTENS CORE - Documentação de Arquitetura

Este documento apresenta a arquitetura da plataforma **INSYSTENS Electoral Intelligence**, detalhando a governança de camadas, os fluxos de integração e os princípios fundamentais adotados no projeto.

---

## 1. Visão Geral da Arquitetura

O ecossistema é organizado em um fluxo de responsabilidades unidirecional e totalmente desacoplado, garantindo alta flexibilidade e extensibilidade tecnológica:

```
MandatoPro (Cliente SaaS Consumidor da API)
   ↓
ContextProvider (Resolvedor centralizado do perfil político do tenant)
   ↓
INSYSTENS CORE (Núcleo imutável de controle comercial e de recursos)
   ↓
Strategic Intelligence Kernel - SIK (Núcleo de orquestração estratégica)
   ↓
Strategic Domain Models - SDM (Modelos de domínio estratégico tipados e ricos)
   ↓
Modules (Regras analíticas específicas)
   ↓
Adapters (Camadas de tradução e drivers)
   ↓
Repositories (Abstração total da camada de dados - IRL)
   ↓
Providers (Bancos de dados físicos: PostgreSQL, BigQuery, ClickHouse, Mocks)
```

---

## 2. Governança de Camadas de Diretórios

O projeto segue a estrutura de separação a seguir:

* **`core/`**: O núcleo imutável da plataforma. Contém o Contexto (`context/`), os Modelos de Domínio (`domain/`), o Kernel Estratégico (`kernel/`), os Repositórios de Abstração (`repositories/`), as Feature Flags (`featureFlags/`) e as Definições de Planos (`plans/`).
* **`modules/`**: Contém regras específicas de negócios analíticos (como mapas de calor futuros e análises estatísticas regionais).
* **`adapters/`**: Camada que traduz eventos de entrada ou formatos para drivers de saída específicos.
* **`shared/`**: Recursos compartilhados de infraestrutura (como utilitários globais, constantes e tipagens fundamentais).
* **`docs/`**: A "Constituição Oficial" do projeto, contendo toda a documentação da plataforma.

---

## 3. Princípios Fundamentais de Engenharia

Para operar como um produto SaaS de nível corporativo (*Enterprise*), todas as alterações arquiteturais e novas implementações devem seguir rigidamente estes princípios:

1. **Clean Architecture**: Regras de negócio estratégicas e pontuações do Kernel nunca devem depender de detalhes de implementação (como ORMs, servidores web ou APIs externas).
2. **SOLID**:
   * **Responsabilidade Única (SRP)**: Cada classe ou módulo deve possuir apenas um motivo para mudar.
   * **Segregação de Interfaces (ISP)**: O Kernel só deve enxergar os dados de leitura estritamente necessários através do repositório.
   * **Inversão de Dependências (DIP)**: Módulos de alto nível (Kernel) não devem depender de módulos de baixo nível (Prisma/PostgreSQL). Ambos devem depender de abstrações.
3. **Repository Pattern (IRL - Intelligence Repository Layer)**: Abstração de persistência. O Kernel nunca executa queries SQL diretamente. Ele consome a interface `IntelligenceRepository` injetada via `RepositoryFactory` e resolvida em tempo de execução.
4. **Provider Pattern**: Permite alternar os motores de banco físico no arquivo de configuração do ambiente (`INTELLIGENCE_PROVIDER`) de forma transparente.
5. **Dependency Injection**: O repositório ativo e o contexto são injetados nas funções executivas do Kernel em tempo de execução.
6. **Versionamento Estrito**: A resposta consolidada do Kernel sempre informa as versões (`kernelVersion`, `repositoryVersion` e `dataMode`), garantindo retrocompatibilidade no ciclo de vida do cliente.
