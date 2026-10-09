# INSYSTENS CORE - Manifesto dos Algoritmos (SIK Metrics)

Este documento dita os princípios matemáticos, operacionais e de governança para as fórmulas de cálculo e métricas estratégicas da plataforma **INSYSTENS Electoral Intelligence**.

---

## 1. O que é um Algoritmo do INSYSTENS?
É um motor de transformação lógico-matemático puro, agnóstico a banco de dados e APIs externas, que consome o contexto político de um candidato e dados de cobertura de campo para gerar pontuações estratégicas determinísticas, classificações e direcionamento estratégico.

## 2. O que é um Score?
É um indicador percentual (0 a 100) que reflete a saúde ou risco de um aspecto da campanha política (ex: solidez geográfica, riscos de abstenção ou avanço de concorrentes).

## 3. O que é um Strategic Index?
É a métrica de consolidamento e ponderação global de scores que reflete a performance final da conta política. O **ISI (INSYSTENS Strategic Index)** é o principal índice estratégico da Alcântara Sistemas, variando de 0 a 1000 pontos.

---

## 4. O Funcionamento dos Indicadores Iniciais

* **ISI (INSYSTENS Strategic Index)**: Mede a saúde consolidada do gabinete/campanha.
  * *Fórmula de referência*: `ISI = (TCS * 0.4 + GOS * 0.4 + (100 - PRS) * 0.2) * 10`
* **TCS (Territory Confidence Score)**: Percentual de certeza territorial. Pondera o volume de líderes ativos e capilaridade geográfica.
* **GOS (Growth Opportunity Score)**: Mede o potencial de expansão baseando-se no eleitorado não alcançado em zonas vizinhas.
* **PRS (Political Risk Score)**: Mede a abstenção provável e presença de opositores na região.

---

## 5. Criação, Versionamento e Retrocompatibilidade

* **Criação de novos Algoritmos**: Novos motores devem implementar a interface `ScoreEngine` do `ScoreRegistry`, definindo `code`, `name` e a função pura `calculate()`.
* **Versionamento dos Algoritmos**: As regras de scores devem ser versionadas usando versionamento semântico (`Major.Minor.Patch`). Qualquer alteração na fórmula matemática exige incremento de versão.
* **Recálculo Histórico**: A alteração de fórmulas e atualizações não deve apagar dados gerados anteriormente. O sistema deve registrar a versão do algoritmo usada na geração das pontuações nos metadados para auditoria histórica.
* **Documentação de Alterações**: Toda mudança em fórmulas ou adição de scores exige criação de uma RFC correspondente detalhando a modelagem e a aprovação no comitê técnico.
