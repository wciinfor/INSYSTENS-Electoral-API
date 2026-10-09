-- CreateTable
CREATE TABLE IF NOT EXISTS "analytics"."DecisionRecord" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reasons" JSONB NOT NULL,
    "recommendedActions" JSONB NOT NULL,
    "relatedSignals" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionRecord_pkey" PRIMARY KEY ("tenantId","id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionRecord_tenantId_idx" ON "analytics"."DecisionRecord"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionRecord_tenantId_category_idx" ON "analytics"."DecisionRecord"("tenantId", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DecisionRecord_tenantId_priority_idx" ON "analytics"."DecisionRecord"("tenantId", "priority");
