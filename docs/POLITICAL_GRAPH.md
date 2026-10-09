# INSYSTENS CORE - Political Knowledge Graph (PKG)

Este documento descreve a infraestrutura e a governança conceitual do **Political Knowledge Graph (PKG)** da plataforma, o motor relacional que mapeia conexões de influência eleitoral.

> [!IMPORTANT]
> **INDEPENDÊNCIA TECNOLÓGICA**: "Nesta fase não será utilizado Neo4j ou qualquer banco de grafos. O domínio do PKG é implementado em TypeScript nativo para manter a portabilidade e evitar infraestrutura acessória complexa."

---

## 1. Estrutura do Módulo

O módulo do grafo político está estruturado sob a pasta:
`src/modules/political-graph/`

Os componentes principais criados são:
* **`types/GraphTypes.ts`**: Tipagens oficiais contendo os enums de nós e relações e interfaces base (`IPoliticalNode`, `IPoliticalEdge`, `IPoliticalGraph`).
* **`entities/PoliticalNode.ts`**: Classe de representação de vértices com suporte a metadados dinâmicos e scores.
* **`entities/PoliticalEdge.ts`**: Classe de representação de arestas com suporte a pesos de relacionamento e graus de confiança.
* **`entities/PoliticalGraph.ts`**: Container do grafo agregador indexado por conta.
* **`builders/GraphBuilder.ts`**: Construtor responsável por processar o contexto e injetar dados de repositório em redes topológicas.
* **`services/GraphAnalysisService.ts`**: Motor algorítmico responsável por extrair insights e inteligência sobre a estrutura do grafo.

---

## 2. Tipos de Nós Habilitados (PoliticalNodeType)

* **POLITICIAN**: Representa a conta ou candidato avaliado.
* **PARTY**: Representa partidos políticos.
* **CITY**: Representação geográfica municipal.
* **ELECTORAL_ZONE**: Representação geográfica de zonas.
* **SECTION**: Seção eleitoral.
* **LEADER**: Lideranças e coordenadores em campo.
* **SOCIAL_ACTION**: Ações sociais promovidas.
* **DEMAND**: Demandas comunitárias registradas.
* **EVENT**: Eventos de campanha.
* **VOTER**: Eleitores individuais.
* **CAMPAIGN**: Campanhas ou comitês associados.

---

## 3. Tipos de Relações Habilitadas (PoliticalEdgeType)

* **BELONGS_TO**: Candidatos ou líderes pertencentes a partidos.
* **PARTICIPATED_IN**: Participação em eventos.
* **INFLUENCES**: Lideranças exercendo influência sobre eleitores.
* **REPRESENTS**: Candidato representando uma região geográfica.
* **HAS_DEMAND**: Eleitor possuindo uma demanda cadastrada.
* **ATTENDED**: Eleitores ou líderes que compareceram a eventos/ações sociais.
* **CONNECTED_TO**: Conexões genéricas de rede.
* **LOCATED_IN**: Pertencimento geográfico (ex: seção localizada em zona).
* **SUPPORTED_BY**: Apoio político explícito.
* **IMPACTED_BY**: Zonas ou eleitores impactados por ações.

---

## 4. O Papel do GraphBuilder

O **`GraphBuilder`** atua como um tradutor de estruturas relacionais do banco. Ele consome o `PoliticalIntelligenceContext` (ContextProvider) e os dados agregados da IRL (`IntelligenceRepository`) para carregar em memória os nós e arestas conectados correspondentes a toda a rede de influência da conta. Desta forma, o Kernel de Inteligência tem acesso a um objeto de grafo limpo e pronto para análise sem realizar acessos a banco diretamente.

---

## 5. O Papel do GraphAnalysisService

O **`GraphAnalysisService`** executa rotinas de processamento topológico sobre a estrutura do grafo construído:
* **`findInfluenceNodes`**: Encontra os líderes com maior centralidade de influência.
* **`findStrongConnections`**: Filtra arestas com pesos altos de confiança.
* **`findIsolatedRegions`**: Identifica zonas e municípios sem conexões suficientes, apontando "gargalos" territoriais.
* **`findStrategicOpportunities`**: Mapeia regiões desassistidas onde os líderes de maior influência podem ser alocados.
* **`generateGraphSummary`**: Consolida estatísticas de densidade da rede e distribuição de nós/relações.
