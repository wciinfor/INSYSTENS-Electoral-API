# INSYSTENS Electoral Intelligence - Guia de Contribuição (Contributing)

Este guia define os padrões e restrições obrigatórios para desenvolvedores, arquitetos e **agentes de IA** que atuam no desenvolvimento da plataforma.

---

## 1. Regras Arquiteturais Mandatórias

* **Respeito à Clean Architecture**: Mantenha as regras de negócio puras de dependências externas. O Kernel SIK (`src/core/kernel/`) deve ser mantido agnóstico quanto à persistência e rotas web.
* **Isolamento de Persistência (IRL)**: **NUNCA** faça queries SQL ou acione o Prisma Client diretamente de dentro das classes analíticas ou pontuações do Kernel. Toda leitura deve ocorrer através da abstração definida na interface `IntelligenceRepository`.
* **Inversão de Dependências**: Adicione novos repositórios ou drivers sempre registrando-os no `RepositoryRegistry` e instanciando-os via `RepositoryFactory`.
* **Acesso do Consumidor**: O endpoint `/api/v1/tenant/intelligence/kernel` é e deve permanecer opaco e unificado. Não exponha flags de controle de persistência (como `?mode`) na URL pública da API. A escolha do repositório é resolvida internamente por variáveis de ambiente.
* **Preservação do CORE**: O CORE é considerado congelado. Não faça alterações em arquivos sob `src/core/` sem aprovação prévia de arquitetura ou justificativa técnica documentada.
* **Não Alteração Indireta de Planos**: Não modifique as regras e Feature Flags de `ProductPlans.ts` diretamente para burlar limitações operacionais de contas de clientes.
* **Processo de RFC Obrigatório**: Nenhuma alteração estrutural na arquitetura, modelos de domínio ou algoritmos matemáticos do Kernel SIK poderá ser implementada sem a criação, discussão e aprovação formal de uma RFC (`docs/RFC_PROCESS.md`).

---

## 2. Padrões de Código e Performance

* **Não Crie Processamento Pesado**: Consultas de loops ineficientes na API são inaceitáveis. Se for necessário agregar milhões de votos, a agregação deve ocorrer no repositório específico (ex: em consultas otimizadas ou materialized views) e nunca em tempo de execução na memória do Node.js.
* **Tipagem Estrita**: Toda nova funcionalidade deve ser escrita com TypeScript de forma estrita, garantindo que o comando `npm run typecheck` passe com zero erros antes de qualquer commit ou deploy.
* **Imutabilidade de Comentários**: Preserve os comentários e JSDocs existentes que documentam regras eleitorais.

---

## 3. Práticas de Versionamento e Documentação

* **Documentação Obrigatória**: Toda nova Sprint de desenvolvimento deve, obrigatoriamente, atualizar os documentos oficiais na pasta `docs/` e o arquivo consolidado `walkthrough.md` antes da entrega final.
* **Independência Tecnológica**: Ao projetar novas estruturas relacionais de grafos (`PoliticalGraph`), mantenha a implementação nativa em TypeScript. A plataforma deve rodar localmente sem a exigência de bancos NoSQL de grafos.
