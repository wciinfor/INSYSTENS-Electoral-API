-- CreateTable
CREATE TABLE IF NOT EXISTS "analytics"."DecisionAuditEventRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'system',
    "decisionCategory" TEXT,
    "decisionPriority" TEXT,
    "relatedSignals" JSONB,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionAuditEventRecord_pkey" PRIMARY KEY ("tenantId","id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionAuditEventRecord_tenantId_idx" ON "analytics"."DecisionAuditEventRecord"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionAuditEventRecord_tenantId_decisionId_idx" ON "analytics"."DecisionAuditEventRecord"("tenantId", "decisionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionAuditEventRecord_tenantId_actorId_idx" ON "analytics"."DecisionAuditEventRecord"("tenantId", "actorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionAuditEventRecord_tenantId_operation_idx" ON "analytics"."DecisionAuditEventRecord"("tenantId", "operation");
