-- CreateTable: ActionProposalRecord
CREATE TABLE IF NOT EXISTS "analytics"."ActionProposalRecord" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "estimatedGain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeframe" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionProposalRecord_pkey" PRIMARY KEY ("tenantId","id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionProposalRecord_tenantId_idx" ON "analytics"."ActionProposalRecord"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionProposalRecord_tenantId_decisionId_idx" ON "analytics"."ActionProposalRecord"("tenantId", "decisionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionProposalRecord_tenantId_status_idx" ON "analytics"."ActionProposalRecord"("tenantId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionProposalRecord_tenantId_priority_idx" ON "analytics"."ActionProposalRecord"("tenantId", "priority");
