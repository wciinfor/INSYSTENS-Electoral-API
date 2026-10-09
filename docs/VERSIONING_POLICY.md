# INSYSTENS CORE - Política de Versionamento Técnico

Este documento descreve a governança de versões para os diferentes blocos da plataforma **INSYSTENS Electoral Intelligence**.

---

## 1. Diretrizes de Versionamento por Camada

A plataforma é modular, o que exige políticas de versionamento independentes para cada subsistema para evitar acoplamento de atualizações:

### CORE Framework
* **Formato**: SemVer (`Major.Minor.Patch`) - Ex: `CORE 1.0.0`
* **Regra**: Incrementa `Major` em caso de breaking changes arquiteturais que exijam atualização das assinaturas de interfaces centrais do repositório ou do ContextProvider.

### Algoritmos e Pontuações (SIK Engines)
* **Formato**: SemVer independente por algoritmo - Ex: `ISI 1.0.0`, `TCS 1.2.0`
* **Regra**: Qualquer alteração de pesos, fórmulas matemáticas ou inclusão de variáveis na modelagem de cálculo de score exige incremento do versionamento correspondente, registrado nos metadados da resposta.

### Political Knowledge Graph (PKG)
* **Formato**: SemVer - Ex: `PKG 1.0.0`
* **Regra**: Incrementado sempre que novos tipos de nós (`PoliticalNodeType`) ou conexões (`PoliticalEdgeType`) forem adicionados ao domínio do grafo.

### Repositório e Persistência (IRL Providers)
* **Formato**: SemVer - Ex: `Repository 1.0.0`
* **Regra**: Reflete a versão dos drivers de conexão (como `PrismaIntelligenceRepository` ou futuros BigQuery/ClickHouse).

### API Routes e Contratos Públicos
* **Formato**: Versão na URL - Ex: `/api/v1/`
* **Regra**: Versão principal (v1, v2) na rota. Mudanças menores adicionam campos opcionais no JSON mantendo retrocompatibilidade sem alterar a versão na rota.

### Strategic Domain Models (SDM)
* **Formato**: SemVer
* **Regra**: Alterações na assinatura de interfaces dos modelos de domínio (como `StrategicRecommendation` ou `StrategicAlert`) geram novos patches ou minor releases.

---

## 2. Matriz de Versionamento de Exemplo

| Subsistema | Versão Ativa | Tipo de Versionamento |
| :--- | :--- | :--- |
| **INSYSTENS CORE** | `1.0.0` | SemVer Global |
| **Algoritmo ISI** | `1.0.0` | SemVer por Engine |
| **Political Graph (PKG)**| `1.0.0` | SemVer Modular |
| **Repository Layer (IRL)**| `1.0.0` | SemVer por Driver |
| **API Endpoints** | `/v1/` | Versionamento na URL |
| **Domain Models (SDM)** | `1.0.0` | SemVer |
