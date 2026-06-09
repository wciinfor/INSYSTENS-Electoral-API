# INSYSTENS Electoral API

Plataforma independente de inteligência eleitoral criada para importar, processar e disponibilizar dados eleitorais do TSE via API RESTful para o MANDATOPRO e outros serviços integrados.

---

## 🚀 Instalação e Preparação

### Requisitos Prévios
- **Node.js** (versão 20 LTS ou superior recomendada)
- **npm** (incluso com o Node.js)

### Instruções para Instalação de Dependências
A partir do diretório raiz desta pasta (`electoral-api`), execute o comando para instalar as dependências de todo o workspace de forma automática:

```bash
npm install
```

---

## 💻 Execução Local

### 1. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` dentro da pasta raiz da API (`apps/api`):

```bash
cp apps/api/.env.example apps/api/.env
```

### 2. Configuração do Banco de Dados PostgreSQL
Antes de executar a aplicação, certifique-se de que possui uma instância ativa do PostgreSQL e que a variável `DATABASE_URL` no seu arquivo `apps/api/.env` está configurada corretamente:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public"
```

Gere o client do Prisma e execute as migrations para estruturar o banco:
```bash
# Gerar o Prisma Client
npm run prisma:generate

# Rodar as migrations para criar as tabelas
npm run prisma:migrate
```

### 3. Rodar em Ambiente de Desenvolvimento (Hot Reload)
Execute o comando a partir do diretório raiz do projeto:

```bash
npm run dev
```

A API estará disponível por padrão em: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

---

## 🛠️ Scripts NPM Disponíveis

No diretório raiz (`electoral-api/`), você pode executar os seguintes scripts:

- **`npm run dev`**: Executa o servidor da API em modo de desenvolvimento com hot-reload usando `ts-node-dev`.
- **`npm run build`**: Compila todo o código TypeScript em JavaScript na pasta `dist/`.
- **`npm run start`**: Executa o código compilado de produção.
- **`npm run lint`**: Roda o linter ESLint para verificar padrões de escrita de código.
- **`npm run typecheck`**: Valida a integridade dos tipos TypeScript sem gerar arquivos de saída.
- **`npm run prisma:generate`**: Gera o cliente do Prisma com base no schema.
- **`npm run prisma:migrate`**: Executa as migrations pendentes no banco de dados.
- **`npm run prisma:studio`**: Abre o painel visual Prisma Studio para navegar nos dados do banco.
- **`npm run importer:dev -- <argumentos>`**: Executa o importador CLI em desenvolvimento (via `ts-node`).
- **`npm run importer:build`**: Compila o importador TypeScript em JavaScript na pasta `apps/importer/dist/`.
- **`npm run importer:start -- <argumentos>`**: Executa o importador compilado em produção.

---

## 📥 Como Usar o Importer (CLI)

O importador CLI processa arquivos CSV em lote utilizando fluxos contínuos de dados (Streams), mantendo baixo consumo de RAM mesmo para arquivos gigantes.

Execute o comando a partir do diretório raiz (`electoral-api/`):

```bash
npm run importer:dev -- --file ./data/tse/arquivo.csv --type electorate --uf PA --year 2024 --round 1
```

### Argumentos Aceitos:
* `--file`: Caminho relativo ou absoluto do arquivo CSV.
* `--type`: Tipo de importação (`electorate` ou `votes`).
* `--uf`: Unidade federativa correspondente (ex: `PA`, `SP`, `RJ`).
* `--year`: Ano da eleição (ex: `2024`).
* `--round`: Turno da eleição (`1` ou `2`).
* `--analyze`: (Opcional) Executa apenas a análise de layout do arquivo CSV, mostrando delimitador, codificação, total de colunas e amostras de valores de cabeçalho, sem inserir dados no banco.

Exemplo de uso em modo de análise:
```bash
npm run importer:dev -- --file ./data/tse/arquivo.csv --type electorate --uf PA --year 2024 --round 1 --analyze
```



---

## 📊 Estrutura de Banco Atualizada

### 1. Perfil Demográfico do Eleitorado (`SectionElectorateProfile`)
Armazena dados demográficos detalhados e consolidados por seção eleitoral para fins analíticos:
- `electionYear`: Ano da eleição.
- `uf`: Unidade Federativa.
- `cityCode` / `cityName`: Código e nome do município.
- `zoneNumber` / `sectionNumber`: Zona e Seção eleitoral.
- `pollingLocationCode`: Código do local de votação.
- `gender` / `ageRange` / `education` / `race` / `maritalStatus`: Campos demográficos descritivos e seus respectivos códigos.
- `votersCount` / `biometricVotersCount` / `disabledVotersCount` / `socialNameVotersCount`: Métricas de contagem de eleitores.

### 2. Votos de Seção (`SectionVote`)
Modelagem robusta para conter votos nominais, de legenda, brancos, nulos e anulados, estruturada de forma a evitar colisões entre diferentes cargos na mesma seção:
- **Agrupamento Chave**: Os votos são sempre unicamente identificados e associados pela combinação de **Eleição**, **Seção Eleitoral**, **Cargo** (`officeCode`) e **Votável** (`votableType` + `votableNumber`).
- `candidateId`: Opcional (nulo para votos não nominais de legenda, branco, nulo ou anulado).
- `officeCode` / `officeName`: Código e nome do cargo (evita colisões entre cargos diferentes na mesma seção com números votáveis idênticos).
- `votableType`: Classificação do voto (`NOMINAL`, `LEGENDA`, `BRANCO`, `NULO`, `ANULADO`).
- `votableNumber` / `votableName`: Número e nome correspondentes (ex: número do candidato, da legenda, ou "Branco").
- `partyNumber` / `partyAcronym` / `partyName`: Dados do partido associado.

---

## 🌐 Endpoints Disponíveis Inicialmente

- **GET `/health`**: Retorna informações básicas de integridade do servidor de forma direta.
- **GET `/api/v1/health`**: Endpoint versionado contendo status da API, ambiente e timestamp atualizado.
- **GET `/api/v1/health/db`**: Testa a conexão ativa com o PostgreSQL via Prisma Client.

---

## 🔮 Próximos Passos Sugeridos

1. **Desenvolvimento do Core Importer (`apps/importer`)**:
   - Implementar os pipelines de Stream com injeção de alta performance (Bulk Copy / SQL Batch) para carregar os arquivos CSV do TSE.
2. **Autenticação**:
   - Desenvolver o middleware de verificação de API Keys nas rotas privadas utilizando a tabela `ApiKey`.

---

## 🐳 Deploy com Docker e EasyPanel (Produção)

Esta aplicação foi preparada para rodar de forma isolada em containers Docker, o que previne qualquer tipo de conflito com aplicações existentes na VPS (como Evolution API e n8n).

### 1. Build e Execução Local com Docker Compose
Para testar a infraestrutura de produção localmente, primeiro configure as variáveis criando um arquivo `.env` baseado no arquivo `.env.production.example`.

**Comando para build local dos containers:**
```bash
docker compose -f docker-compose.prod.yml build
```

**Comando para subir os containers em background:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

### 2. Implantação através do EasyPanel

O **EasyPanel** é baseado no Docker Swarm e gerencia o Traefik como roteador de borda. Siga os passos abaixo para implantar no painel:

1. **Criar um Novo Projeto** no painel do EasyPanel (ex: `electoral-api`).
2. **Adicionar Serviço de Banco de Dados (PostgreSQL)**:
   - Escolha o template oficial do PostgreSQL.
   - Configure o nome como `electoral-postgres` e defina as credenciais de acesso (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).
   - Mantenha a porta `5432` **privada** (não exposta externamente).
3. **Adicionar Serviço de Cache (Redis)** (Opcional):
   - Adicione o template oficial do Redis com o nome `electoral-redis`.
4. **Adicionar Serviço de Aplicação (App)**:
   - **Source**: Configure apontando para o seu repositório Git do projeto.
   - **Build**:
     - Selecione o método `Dockerfile`.
     - Defina o caminho do Dockerfile como `apps/api/Dockerfile`.
   - **Environment Variables**:
     - Defina `NODE_ENV=production`.
     - Defina `DATABASE_URL` usando o DNS interno criado pelo EasyPanel (ex: `postgresql://electoral_user:senha@electoral-postgres:5432/insystens_electoral`).
     - Defina `REDIS_URL` (ex: `redis://electoral-redis:6379`).
     - Defina `PORT=3001`.
     - Defina `API_KEY_SECRET` com o seu hash de segurança.
   - **Routing**:
     - Configure a **Porta da Aplicação** como `3001`.
     - Defina o seu subdomínio de produção desejado (o EasyPanel configurará automaticamente o Traefik e gerará o certificado SSL).
5. **Realizar Deploy**: O EasyPanel executará o build multi-stage baseado no Dockerfile e fará o deploy sem indisponibilidade.



