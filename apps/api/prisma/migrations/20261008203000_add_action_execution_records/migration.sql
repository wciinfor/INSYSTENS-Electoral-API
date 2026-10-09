-- CreateTable: ActionExecutionRecord
CREATE TABLE IF NOT EXISTS "analytics"."ActionExecutionRecord" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mode" TEXT NOT NULL DEFAULT 'SIMULATED',
    "executedBy" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionExecutionRecord_pkey" PRIMARY KEY ("tenantId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ActionExecutionRecord_tenantId_proposalId_attemptNumber_key" ON "analytics"."ActionExecutionRecord"("tenantId", "proposalId", "attemptNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionExecutionRecord_tenantId_idx" ON "analytics"."ActionExecutionRecord"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionExecutionRecord_tenantId_proposalId_idx" ON "analytics"."ActionExecutionRecord"("tenantId", "proposalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionExecutionRecord_tenantId_status_idx" ON "analytics"."ActionExecutionRecord"("tenantId", "status");
