# INSYSTENS CORE - Domain Language (Glossário Oficial)

Este documento define o vocabulário oficial da plataforma **INSYSTENS Electoral Intelligence**. Nenhum termo conceitual ou de código deve ser introduzido sem a devida conformação com esta lista.

---

* **Account**: Representa uma conta contratante da plataforma (o gabinete de um parlamentar, o diretório de um partido ou uma consultoria política). Mapeia-se ao isolamento físico `tenantId`.
* **PoliticalProfile**: Dados políticos específicos de uma `Account` (nome de urna, cargo disputado, partido, UF e cidade).
* **PoliticalContext**: Estado agregado que unifica as informações geográficas, partidárias e eleitorais ativas de uma conta.
* **StrategicScore**: Pontuações calculadas de forma determinística pelo SIK para medir a saúde política de uma conta. Exemplos: `TCS`, `GOS`, `PRS`, `ISI`.
* **INSYSTENS Strategic Index (ISI)**: Índice proprietário da Alcântara Sistemas que pondera o desempenho e engajamento da conta (escala de 0 a 1000).
* **Territory Confidence Score (TCS)**: Mede a solidez e capilaridade do político com base em suas lideranças e registros na UF.
* **Growth Opportunity Score (GOS)**: Avalia o potencial de crescimento eleitoral em seções geográficas adjacentes.
* **Political Risk Score (PRS)**: Mede a presença e avanço de concorrentes em zonas de influência.
* **KernelAnalysis**: Resultado consolidado da execução de scores, recomendações, oportunidades e alertas pelo pipeline do SIK.
* **ExecutiveSummary**: Tradução textual estruturada e acessível das métricas do Kernel voltada para o usuário final.
* **AIContext**: Payload de contexto limpo e estruturado para alimentar e instruir Large Language Models (LLMs) em etapas de mentoria.
* **StrategicRecommendation / StrategicAlert**: Direcionamento acionável gerado pelo Kernel visando impulsionar a campanha ou alertar sobre desvios.
* **TerritorialOpportunity**: Oportunidade geográfica (zona ou seção) de expansão priorizada pelo SIK.
* **PoliticalGraph**: Estrutura abstrata de rede que mapeia conexões de influência política, relacionando lideranças, eleitores e zonas eleitorais.
* **PoliticalNode / PoliticalEdge**: Entidades de nó (ex: líderes, cidades) e arestas de relacionamento do grafo de influência.
* **IntelligenceRepository**: Interface de persistência da camada analítica (IRL).
* **FeatureFlag**: Chave de controle lógico comercial (toggle) de recursos do sistema.
* **Capability**: Matriz de acessos operacionais (leitura/escrita de relatórios, uso de simulador) gerada a partir das Feature Flags.
* **ProductPlan**: Plano comercial associado à conta.

## Modelos de Domínio Estratégicos (Strategic Domain Models - SDM)

* **StrategicIndex**: Representa o objeto de dados unificado do "INSYSTENS Strategic Index (ISI)" (Índice Alcântara Sistemas).
* **MunicipalityPerformance**: Modelo de desempenho territorial municipal mapeando votos, força local e classificação estratégica (ex: Retenção/Expansão).
* **TerritorialOpportunity**: Oportunidade geográfica estruturada listando prioridade, impacto estimado e ações sugeridas pelo SIK.
* **PoliticalPresence**: Consolidação de presença política mapeando nível de engajamento, ações sociais e densidade de líderes em campo.
* **StrategicRecommendation**: Recomendação analítica acionável com estimativa de ganho de votos e grau de confiança.
* **StrategicAlert**: Alertas críticos com grau de severidade e ações imediatas.
* **CampaignScenario**: Projeções probabilísticas e cenários de crescimento ou risco para simuladores de campanha.
* **ExecutiveSummary**: Estrutura analítica que divide a síntese em destaques, riscos, oportunidades e recomendações geradas pelo Kernel.
* **GraphBuilder**: Componente tradutor encarregado de montar a malha topológica do grafo político a partir do contexto.
* **GraphAnalysis**: Processo analítico e algorítmico executado sobre o grafo para extrair centralidades de influência e gargalos geográficos.

## Sinais Estratégicos (Strategic Signals Engine - SSE)

* **StrategicSignal**: Entidade de tradução que converte pontuações abstratas (scores) em mensagens claras, interpretáveis, explicadas e acionáveis pelo político.
* **SignalTrend**: Direção da tendência temporal do sinal (Crescente, Estável, Decrescente, Desconhecido).
* **SignalPriority**: Grau de prioridade atribuído a ações recomendadas associadas ao sinal (Baixa, Média, Alta, Urgente).
* **SignalStatus**: Estado de saúde consolidado do sinal (Muito Positivo, Positivo, Neutro, Atenção, Crítico).
* **SignalExplanation**: Detalhamento e contextualização explicável do porquê o sinal atingiu determinada pontuação e nível.
* **SignalAction**: Ação executiva recomendada imediata contendo impacto estimado e ganho de votos previsto.

## Decision Engine (Engine de Decisão)

* **Decision**: Entidade de domínio representando uma decisão executiva acionável e estruturada com prioridade, razões, ações recomendadas e impacto esperado.
* **DecisionPriority**: Nível de priorização da decisão baseado na severidade/urgência do sinal relacionado (LOW, MEDIUM, HIGH, URGENT).
* **DecisionCategory**: Classificação temática da decisão (TERRITORIAL, RISK, GROWTH, ENGAGEMENT, LEADERSHIP, CAMPAIGN, STRATEGIC).
* **DecisionReason**: Justificativa explícita e explicável que embasa a decisão, contendo título, descrição, evidência e peso da convicção.
* **RecommendedAction**: Ação sugerida atrelada diretamente à decisão, incluindo impacto esperado, estimativa de votos ganhos e prazo previsto (timeframe).
* **DecisionEngine**: Mecanismo responsável por traduzir múltiplos `StrategicSignal` em un conjunto enxuto de decisões acionáveis, ordenando por gravidade e agrupando sinergias por categoria.

## Strategic Timeline (Linha do Tempo Estratégica)

* **StrategicTimeline**: Agenda consolidada contendo eventos cronológicos e recomendações transversais de alto nível.
* **TimelineEvent**: Evento individual da agenda com datas de início/fim (ISO), status de execução (PLANNED, SUGGESTED, etc.), prioridade e impacto esperado.
* **TimelinePriority**: Grau de urgência de execução do evento na linha do tempo (LOW, MEDIUM, HIGH, URGENT).
* **TimelineStatus**: Situação atual do evento (PLANNED, SUGGESTED, IN_PROGRESS, COMPLETED, EXPIRED).
* **TimelineRecommendation**: Recomendações executivas acionáveis integradas ao cronograma contendo estimativas de votos e confiança.
* **StrategicTimelineEngine**: Motor responsável por converter a lista de `Decision` em uma linha do tempo organizada cronologicamente e priorizada por severidade.



