# INSYSTENS - Roadmap de Desenvolvimento

Este documento descreve o plano de evolução e entregas da plataforma **INSYSTENS Electoral Intelligence**, organizado em fases sequenciais.

---

## FASE 01: Foundation
* **Objetivo**: Estruturar a infraestrutura inicial do projeto, banco de dados inicial (Prisma), containerização e suporte básico multi-tenant.
* **Status**: **CONCLUÍDO**
* **Dependências**: Configurações de VPS e ambiente Docker.
* **Próximos Passos**: Monitorar logs iniciais de saúde da API.

## FASE 02: Strategic Intelligence Kernel (SIK)
* **Objetivo**: Criar o orquestrador puro de lógica estratégica da plataforma e o ScoreRegistry contendo os motores TCS, GOS, PRS e ISI.
* **Status**: **CONCLUÍDO**
* **Dependências**: ContextProvider e tipagens estritas de scores.
* **Próximos Passos**: Avançar para o desacoplamento de banco de dados.

## FASE 03: Repository Layer (IRL)
* **Objetivo**: Abstrair totalmente o acesso a dados do Kernel através do padrão Repository, isolando o SIK de consultas diretas ao Prisma.
* **Status**: **CONCLUÍDO**
* **Dependências**: Interface de repositório e fábrica com auto-registro.
* **Próximos Passos**: Integrar e expandir os mocks.

## FASE 04: Commercial Core
* **Objetivo**: Implementar Feature Flags, Product Plans e matriz de Capabilities para governança comercial da API e restrições de uso.
* **Status**: **CONCLUÍDO**
* **Dependências**: Modulabilidade e LicenseService mockado.
* **Próximos Passos**: Preparar regras de controle comercial fino.

## FASE 04.5: Governança, RFC & Algoritmos
* **Objetivo**: Estabelecer a governança de engenharia de software formal, registros de decisões de arquitetura (ADRs), fluxos de RFCs e políticas de versionamento estrito.
* **Status**: **CONCLUÍDO**
* **Dependências**: Consolidação técnica do SIK, IRL e Commercial Core.
* **Próximos Passos**: Conectar as lógicas analíticas ao Grafo Político na próxima fase.

## FASE 05: Political Knowledge Graph
* **Objetivo**: Estruturar em memória (TypeScript puro) o grafo de relacionamentos políticos, vinculando eleitores, lideranças locais e seções de votação.
* **Status**: **PLANEJADO**
* **Dependências**: Dados básicos da base operacional do MandatoPro.
* **Próximos Passos**: Definir interfaces de nós e arestas.

## FASE 06: Data Lake
* **Objetivo**: Mapear a integração de infraestrutura para conectar fontes analíticas de alta performance (ClickHouse/BigQuery) para processamento em larga escala.
* **Status**: **PLANEJADO**
* **Dependências**: Conectividade de rede da VPS de staging/produção.
* **Próximos Passos**: Desenhar adaptadores de repositório.

## FASE 07: TSE Import
* **Objetivo**: Desenvolver os pipelines de streams robustos para importação de CSVs pesados do TSE sem estourar buffers de memória.
* **Status**: **PLANEJADO**
* **Dependências**: Definição de layout de arquivos oficiais.
* **Próximos Passos**: Escrever os parsers de boletins de urna.

## FASE 08: Analytics Engine
* **Objetivo**: Conectar as tabelas populadas do TSE ao repositório analítico para calcular scores de forma real.
* **Status**: **PLANEJADO**
* **Dependências**: Sprints de Importação completadas.
* **Próximos Passos**: Validar cálculos matemáticos de votos por zona.

## FASE 09: Heatmaps
* **Objetivo**: Disponibilizar mapas e coordenadas geográficas otimizadas para visualização de peso de votação.
* **Status**: **PLANEJADO**
* **Dependências**: Integrações de CEP/IBGE na base de dados.
* **Próximos Passos**: Criar rotas de coordenadas geográficas.

## FASE 10: AI Strategic Advisor
* **Objetivo**: Criar o motor que envia o `AIContext` gerado pelo Kernel a modelos LLM para gerar relatórios e respostas a dúvidas de coordenadores de campanha.
* **Status**: **PLANEJADO**
* **Dependências**: Integração do gateway OpenAI/Anthropic.
* **Próximos Passos**: Desenhar os prompts e gerenciar o histórico de chat.

## FASE 11: Campaign Simulator
* **Objetivo**: Permitir que usuários simulem cenários hipotéticos de perda ou ganho de lideranças e vejam o impacto imediato na estimativa de votos.
* **Status**: **PLANEJADO**
* **Dependências**: Grafo Político consolidado.
* **Próximos Passos**: Desenhar modelos matemáticos de propagação de influência.

## FASE 12: National Scale
* **Objetivo**: Otimização final do banco, indexações, particionamento do PostgreSQL de produção e auditorias de concorrência.
* **Status**: **PLANEJADO**
* **Dependências**: Todas as etapas concluídas e testadas em produção local/staging.
* **Próximos Passos**: Homologação final do ecossistema.
