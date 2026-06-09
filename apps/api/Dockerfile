# Build Stage
FROM node:20-bookworm-slim AS builder

WORKDIR /usr/src/app

# Instala dependências de compilação necessárias no Debian-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia configurações de dependências do monorepo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/importer/package.json ./apps/importer/

# Instala todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copia o código fonte e configurações do Prisma
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma

# Gera o Prisma Client localmente no build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npm run prisma:generate -w @electoral-api/api

# Compila o projeto TypeScript para JavaScript na pasta dist
RUN npm run build -w @electoral-api/api

# Limpa e instala apenas dependências de produção para reduzir tamanho
RUN rm -rf node_modules && npm ci --only=production
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npm run prisma:generate -w @electoral-api/api

# Runtime Stage
FROM node:20-bookworm-slim

WORKDIR /usr/src/app

# Instala bibliotecas nativas compartilhadas OpenSSL no container de runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia as dependências de produção e o build final do builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /usr/src/app/apps/api/prisma ./apps/api/prisma

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
