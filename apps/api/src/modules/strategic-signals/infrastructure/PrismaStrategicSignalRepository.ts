import { PrismaClient } from '@prisma/client';
import { StrategicSignal } from '../domain/StrategicSignal';
import { SignalType } from '../domain/SignalType';
import { SignalSeverity } from '../domain/SignalSeverity';
import { ISignalRepository } from '../domain/SignalRepository';

export interface PrismaStrategicSignalRepositoryOptions {
  tenantId?: string;
  prisma?: PrismaClient;
}

export class PrismaStrategicSignalRepository implements ISignalRepository {
  private prisma: PrismaClient;
  private tenantId: string;

  constructor(options?: PrismaStrategicSignalRepositoryOptions) {
    this.prisma = options?.prisma || new PrismaClient();
    this.tenantId = options?.tenantId || 'default';
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  /**
   * Armazena ou atualiza um StrategicSignal de forma idempotente por (tenantId, id).
   */
  async store(signal: StrategicSignal): Promise<void> {
    const signalTenantId =
      signal.metadata && typeof signal.metadata.tenantId === 'string'
        ? signal.metadata.tenantId
        : this.tenantId;

    await this.prisma.strategicSignalRecord.upsert({
      where: {
        tenantId_id: {
          tenantId: signalTenantId,
          id: signal.id,
        },
      },
      create: {
        id: signal.id,
        tenantId: signalTenantId,
        type: signal.type,
        severity: signal.severity,
        confidence: signal.confidence,
        context: signal.context as any,
        reason: signal.reason,
        metadata: signal.metadata as any,
        createdAt: new Date(signal.metadata?.createdAt || Date.now()),
      },
      update: {
        type: signal.type,
        severity: signal.severity,
        confidence: signal.confidence,
        context: signal.context as any,
        reason: signal.reason,
        metadata: signal.metadata as any,
      },
    });
  }

  /**
   * Busca um StrategicSignal por ID estritamente no tenant atual.
   */
  async find(id: string): Promise<StrategicSignal | undefined> {
    const row = await this.prisma.strategicSignalRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id,
        },
      },
    });

    if (!row) return undefined;

    return {
      id: row.id,
      type: row.type as SignalType,
      severity: row.severity as SignalSeverity,
      confidence: row.confidence,
      context: (row.context as any) || {},
      reason: row.reason,
      metadata: (row.metadata as any) || {},
    };
  }

  async getById(id: string): Promise<StrategicSignal | undefined> {
    return this.find(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.strategicSignalRecord.count({
      where: {
        tenantId: this.tenantId,
        id,
      },
    });
    return count > 0;
  }

  async list(): Promise<StrategicSignal[]> {
    const rows = await this.prisma.strategicSignalRecord.findMany({
      where: {
        tenantId: this.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type as SignalType,
      severity: row.severity as SignalSeverity,
      confidence: row.confidence,
      context: (row.context as any) || {},
      reason: row.reason,
      metadata: (row.metadata as any) || {},
    }));
  }

  async findByType(type: SignalType): Promise<StrategicSignal[]> {
    const rows = await this.prisma.strategicSignalRecord.findMany({
      where: {
        tenantId: this.tenantId,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type as SignalType,
      severity: row.severity as SignalSeverity,
      confidence: row.confidence,
      context: (row.context as any) || {},
      reason: row.reason,
      metadata: (row.metadata as any) || {},
    }));
  }

  async count(): Promise<number> {
    return this.prisma.strategicSignalRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });
  }

  async clear(): Promise<void> {
    await this.prisma.strategicSignalRecord.deleteMany({
      where: {
        tenantId: this.tenantId,
      },
    });
  }
}
