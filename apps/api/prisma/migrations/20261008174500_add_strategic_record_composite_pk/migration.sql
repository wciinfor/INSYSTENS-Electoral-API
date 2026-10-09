-- CreateSchemas: criação idempotente dos schemas multi-schema declarados no schema.prisma
CREATE SCHEMA IF NOT EXISTS "analytics";
CREATE SCHEMA IF NOT EXISTS "tse";
CREATE SCHEMA IF NOT EXISTS "mandato";

-- CreateTable: StrategicRecord com chave primária composta (tenantId, id)
CREATE TABLE IF NOT EXISTS "analytics"."StrategicRecord" (
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicRecord_pkey" PRIMARY KEY ("tenantId", "id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategicRecord_tenantId_idx" ON "analytics"."StrategicRecord"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategicRecord_entity_idx" ON "analytics"."StrategicRecord"("entity");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategicRecord_source_idx" ON "analytics"."StrategicRecord"("source");
