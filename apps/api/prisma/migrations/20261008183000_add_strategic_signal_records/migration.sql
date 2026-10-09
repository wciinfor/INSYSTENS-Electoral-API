-- CreateTable
CREATE TABLE IF NOT EXISTS "analytics"."StrategicSignalRecord" (
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "context" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicSignalRecord_pkey" PRIMARY KEY ("tenantId","id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategicSignalRecord_tenantId_idx" ON "analytics"."StrategicSignalRecord"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategicSignalRecord_tenantId_type_idx" ON "analytics"."StrategicSignalRecord"("tenantId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StrategicSignalRecord_tenantId_severity_idx" ON "analytics"."StrategicSignalRecord"("tenantId", "severity");
