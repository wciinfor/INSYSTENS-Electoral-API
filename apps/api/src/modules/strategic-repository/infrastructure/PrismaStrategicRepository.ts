import { PrismaClient } from '@prisma/client';
import { Repository } from '../domain/Repository';
import { RepositoryManifest } from '../domain/RepositoryManifest';
import { RepositoryRecord, RepositoryEntityType } from '../domain/RepositoryRecord';

export interface PrismaRepositoryOptions {
  tenantId?: string;
  prisma?: PrismaClient;
}

export class PrismaStrategicRepository implements Repository {
  private prisma: PrismaClient;
  private tenantId: string;

  constructor(
    public manifest: RepositoryManifest,
    options?: PrismaRepositoryOptions
  ) {
    this.prisma = options?.prisma || new PrismaClient();
    this.tenantId = options?.tenantId || 'default';
  }

  /**
   * Armazena o registro de forma idempotente.
   * Se o registro já existir pelo ID, realiza UPSERT/atualização preservando os dados.
   */
  async store(record: RepositoryRecord): Promise<void> {
    const recordTenantId =
      record.metadata && typeof record.metadata.tenantId === 'string'
        ? record.metadata.tenantId
        : this.tenantId;

    await this.prisma.strategicRecord.upsert({
      where: {
        tenantId_id: {
          tenantId: recordTenantId,
          id: record.id,
        },
      },
      create: {
        id: record.id,
        tenantId: recordTenantId,
        entity: record.entity,
        source: record.source,
        data: record.data,
        metadata: record.metadata,
        createdAt: new Date(record.createdAt),
      },
      update: {
        entity: record.entity,
        source: record.source,
        data: record.data,
        metadata: record.metadata,
      },
    });
  }

  /**
   * Busca um registro por ID isolando estritamente dentro do tenant atual.
   */
  async find(id: string): Promise<RepositoryRecord | undefined> {
    const row = await this.prisma.strategicRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id,
        },
      },
    });

    if (!row) {
      return undefined;
    }

    return this.mapToRecord(row);
  }

  async getById(id: string): Promise<RepositoryRecord | undefined> {
    return this.find(id);
  }

  async exists(id: string): Promise<boolean> {
    const found = await this.find(id);
    return !!found;
  }

  async list(): Promise<RepositoryRecord[]> {
    const rows = await this.prisma.strategicRecord.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => this.mapToRecord(r));
  }

  async findByEntity(entity: string): Promise<RepositoryRecord[]> {
    const rows = await this.prisma.strategicRecord.findMany({
      where: {
        entity,
        tenantId: this.tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => this.mapToRecord(r));
  }

  async count(): Promise<number> {
    return this.prisma.strategicRecord.count({
      where: { tenantId: this.tenantId },
    });
  }

  async clear(): Promise<void> {
    await this.prisma.strategicRecord.deleteMany({
      where: { tenantId: this.tenantId },
    });
  }

  private mapToRecord(row: {
    id: string;
    entity: string;
    source: string;
    data: unknown;
    metadata: unknown;
    createdAt: Date;
    tenantId: string;
  }): RepositoryRecord {
    return {
      id: row.id,
      entity: row.entity as RepositoryEntityType,
      source: row.source,
      data: (row.data as Record<string, any>) || {},
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.createdAt.toISOString(),
    };
  }
}
