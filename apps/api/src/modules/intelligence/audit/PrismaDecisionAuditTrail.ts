import { PrismaClient } from '@prisma/client';
import { DecisionAuditEvent, IDecisionAuditTrail } from './IDecisionAuditTrail';
import { ITransactionalAuditTrail } from './ITransactionalAuditTrail';

export interface PrismaDecisionAuditTrailOptions {
  prisma?: PrismaClient;
}

export class PrismaDecisionAuditTrail implements ITransactionalAuditTrail {
  private readonly prisma: PrismaClient;

  constructor(options?: PrismaDecisionAuditTrailOptions) {
    this.prisma = options?.prisma || new PrismaClient();
  }

  async recordInTransaction(tx: any, event: DecisionAuditEvent): Promise<void> {
    if (!tx || !tx.decisionAuditEventRecord) {
      throw new Error('PrismaDecisionAuditTrail: tx fornecido não é um cliente transacional válido do Prisma.');
    }
    if (!event.tenantId || typeof event.tenantId !== 'string' || event.tenantId.trim() === '') {
      throw new Error('PrismaDecisionAuditTrail: tenantId é obrigatório para registrar evento de auditoria.');
    }

    const eventId = event.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await tx.decisionAuditEventRecord.create({
      data: {
        id: eventId,
        tenantId: event.tenantId,
        actorId: event.actorId,
        actorType: event.actorType,
        decisionId: event.decisionId,
        operation: event.operation,
        result: event.result,
        reason: event.reason,
        source: event.source || 'system',
        decisionCategory: event.decisionCategory,
        decisionPriority: event.decisionPriority,
        relatedSignals: event.relatedSignals as any,
        details: event.details as any,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      },
    });
  }

  async record(event: DecisionAuditEvent): Promise<void> {
    if (!event.tenantId || typeof event.tenantId !== 'string' || event.tenantId.trim() === '') {
      throw new Error('PrismaDecisionAuditTrail: tenantId é obrigatório para registrar evento de auditoria.');
    }

    const eventId = event.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await (this.prisma as any).decisionAuditEventRecord.create({
      data: {
        id: eventId,
        tenantId: event.tenantId,
        actorId: event.actorId,
        actorType: event.actorType,
        decisionId: event.decisionId,
        operation: event.operation,
        result: event.result,
        reason: event.reason,
        source: event.source || 'system',
        decisionCategory: event.decisionCategory,
        decisionPriority: event.decisionPriority,
        relatedSignals: event.relatedSignals as any,
        details: event.details as any,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      },
    });
  }

  async recordMany(events: DecisionAuditEvent[]): Promise<void> {
    for (const ev of events) {
      await this.record(ev);
    }
  }

  async listByTenant(tenantId: string): Promise<DecisionAuditEvent[]> {
    const rows = await (this.prisma as any).decisionAuditEventRecord.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenantId,
      actorId: row.actorId,
      actorType: row.actorType,
      decisionId: row.decisionId,
      operation: row.operation,
      result: row.result,
      reason: row.reason,
      source: row.source,
      decisionCategory: row.decisionCategory,
      decisionPriority: row.decisionPriority,
      relatedSignals: (row.relatedSignals as any) || [],
      details: (row.details as any) || {},
      timestamp: row.timestamp,
    }));
  }

  async listByDecision(tenantId: string, decisionId: string): Promise<DecisionAuditEvent[]> {
    const rows = await (this.prisma as any).decisionAuditEventRecord.findMany({
      where: { tenantId, decisionId },
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenantId,
      actorId: row.actorId,
      actorType: row.actorType,
      decisionId: row.decisionId,
      operation: row.operation,
      result: row.result,
      reason: row.reason,
      source: row.source,
      decisionCategory: row.decisionCategory,
      decisionPriority: row.decisionPriority,
      relatedSignals: (row.relatedSignals as any) || [],
      details: (row.details as any) || {},
      timestamp: row.timestamp,
    }));
  }

  async count(tenantId: string): Promise<number> {
    return await (this.prisma as any).decisionAuditEventRecord.count({
      where: { tenantId },
    });
  }

  async clear(tenantId: string): Promise<void> {
    await (this.prisma as any).decisionAuditEventRecord.deleteMany({
      where: { tenantId },
    });
  }
}
