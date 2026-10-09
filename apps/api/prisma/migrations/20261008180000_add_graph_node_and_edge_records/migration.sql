-- CreateTable: GraphNodeRecord com chave primária composta (tenantId, id)
CREATE TABLE IF NOT EXISTS "analytics"."GraphNodeRecord" (
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphNodeRecord_pkey" PRIMARY KEY ("tenantId", "id")
);

-- CreateTable: GraphEdgeRecord com chave primária composta (tenantId, id) e Foreign Keys compostas
CREATE TABLE IF NOT EXISTS "analytics"."GraphEdgeRecord" (
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphEdgeRecord_pkey" PRIMARY KEY ("tenantId", "id"),
    CONSTRAINT "GraphEdgeRecord_FromNode_fkey" FOREIGN KEY ("tenantId", "from") REFERENCES "analytics"."GraphNodeRecord"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GraphEdgeRecord_ToNode_fkey" FOREIGN KEY ("tenantId", "to") REFERENCES "analytics"."GraphNodeRecord"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: GraphNodeRecord
CREATE INDEX IF NOT EXISTS "GraphNodeRecord_tenantId_idx" ON "analytics"."GraphNodeRecord"("tenantId");
CREATE INDEX IF NOT EXISTS "GraphNodeRecord_type_idx" ON "analytics"."GraphNodeRecord"("type");

-- CreateIndex: GraphEdgeRecord
CREATE INDEX IF NOT EXISTS "GraphEdgeRecord_tenantId_idx" ON "analytics"."GraphEdgeRecord"("tenantId");
CREATE INDEX IF NOT EXISTS "GraphEdgeRecord_tenantId_from_idx" ON "analytics"."GraphEdgeRecord"("tenantId", "from");
CREATE INDEX IF NOT EXISTS "GraphEdgeRecord_tenantId_to_idx" ON "analytics"."GraphEdgeRecord"("tenantId", "to");
CREATE INDEX IF NOT EXISTS "GraphEdgeRecord_relation_idx" ON "analytics"."GraphEdgeRecord"("relation");
