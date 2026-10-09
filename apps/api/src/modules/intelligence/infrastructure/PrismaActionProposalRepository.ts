import { PrismaClient } from '@prisma/client';
import { ActionProposalRecord, ActionProposalStatus } from '../domain/ActionProposalRecord';
import { IActionProposalRepository } from '../domain/IActionProposalRepository';

export interface PrismaActionProposalRepositoryOptions {
  tenantId: string;
  prisma?: PrismaClient;
}

export class PrismaActionProposalRepository implements IActionProposalRepository {
  private readonly prisma: PrismaClient;
  private readonly tenantId: string;

  constructor(options: PrismaActionProposalRepositoryOptions) {
    if (!options || !options.tenantId || typeof options.tenantId !== 'string' || options.tenantId.trim() === '') {
      throw new Error('PrismaActionProposalRepository: tenantId é obrigatório e não pode ser vazio.');
    }
    this.prisma = options.prisma || new PrismaClient();
    this.tenantId = options.tenantId;
  }

  get currentTenantId(): string {
    return this.tenantId;
  }

  async store(proposal: ActionProposalRecord): Promise<void> {
    const targetTenantId = proposal.tenantId || this.tenantId;
    if (targetTenantId !== this.tenantId) {
      return;
    }

    const executeStore = async (tx: any) => {
      // 1. Busca existência prévia antes de tentar inserir para não abortar o bloco transacional no PostgreSQL (25P02)
      const existing = await tx.actionProposalRecord.findUnique({
        where: {
          tenantId_id: {
            tenantId: targetTenantId,
            id: proposal.id,
          },
        },
      });

      if (!existing) {
        try {
          await tx.actionProposalRecord.create({
            data: {
              tenantId: targetTenantId,
              id: proposal.id,
              decisionId: proposal.decisionId,
              category: proposal.category,
              priority: proposal.priority,
              title: proposal.title,
              description: proposal.description,
              expectedImpact: proposal.expectedImpact,
              estimatedGain: proposal.estimatedGain,
              timeframe: proposal.timeframe,
              status: proposal.status,
              metadata: proposal.metadata as any,
              createdAt: proposal.createdAt ? new Date(proposal.createdAt) : new Date(),
            },
          });
          return;
        } catch (createErr: any) {
          // Se houver corrida na criação simultânea fora de transação
          const isConflict =
            createErr?.code === 'P2002' ||
            (createErr?.message && (createErr.message.includes('Unique constraint') || createErr.message.includes('unique')));
          if (!isConflict) {
            throw createErr;
          }
          // Em caso de colisão concorrente, deixa cair no update abaixo
        }
      }

      // 2. Se o registro já existe, executa update seguro preservando status avançado
      // e preservando metadados preexistentes
      const current = existing || (await tx.actionProposalRecord.findUnique({
        where: {
          tenantId_id: {
            tenantId: targetTenantId,
            id: proposal.id,
          },
        },
      }));

      if (!current) {
        return;
      }

      const preservedStatus = current.status !== 'PROPOSED' ? current.status : proposal.status;

      await tx.actionProposalRecord.update({
        where: {
          tenantId_id: {
            tenantId: targetTenantId,
            id: proposal.id,
          },
        },
        data: {
          category: proposal.category,
          priority: proposal.priority,
          title: proposal.title,
          description: proposal.description,
          expectedImpact: proposal.expectedImpact,
          estimatedGain: proposal.estimatedGain,
          timeframe: proposal.timeframe,
          status: preservedStatus,
          metadata: { ...(current.metadata as any), ...(proposal.metadata as any) },
        },
      });
    };

    if (typeof (this.prisma as any).$transaction === 'function') {
      await (this.prisma as any).$transaction(async (tx: any) => {
        await executeStore(tx);
      });
    } else {
      await executeStore(this.prisma);
    }
  }

  async storeMany(proposals: ActionProposalRecord[]): Promise<void> {
    if (!proposals || proposals.length === 0) {
      return;
    }

    const executeBatch = async (tx: any) => {
      for (const p of proposals) {
        const targetTenantId = p.tenantId || this.tenantId;
        if (targetTenantId !== this.tenantId) {
          continue;
        }

        // Verifica existência prévia antes de qualquer insert na transação para evitar que o PostgreSQL aborte o bloco com 25P02
        const existing = await tx.actionProposalRecord.findUnique({
          where: {
            tenantId_id: {
              tenantId: targetTenantId,
              id: p.id,
            },
          },
        });

        if (!existing) {
          await tx.actionProposalRecord.create({
            data: {
              tenantId: targetTenantId,
              id: p.id,
              decisionId: p.decisionId,
              category: p.category,
              priority: p.priority,
              title: p.title,
              description: p.description,
              expectedImpact: p.expectedImpact,
              estimatedGain: p.estimatedGain,
              timeframe: p.timeframe,
              status: p.status,
              metadata: p.metadata as any,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            },
          });
        } else {
          const preservedStatus = existing.status !== 'PROPOSED' ? existing.status : p.status;
          await tx.actionProposalRecord.update({
            where: {
              tenantId_id: {
                tenantId: targetTenantId,
                id: p.id,
              },
            },
            data: {
              category: p.category,
              priority: p.priority,
              title: p.title,
              description: p.description,
              expectedImpact: p.expectedImpact,
              estimatedGain: p.estimatedGain,
              timeframe: p.timeframe,
              status: preservedStatus,
              metadata: { ...(existing.metadata as any), ...(p.metadata as any) },
            },
          });
        }
      }
    };

    if (typeof (this.prisma as any).$transaction === 'function') {
      await (this.prisma as any).$transaction(async (tx: any) => {
        await executeBatch(tx);
      });
    } else {
      await executeBatch(this.prisma);
    }
  }

  async find(id: string): Promise<ActionProposalRecord | null> {
    const row = await (this.prisma as any).actionProposalRecord.findUnique({
      where: {
        tenantId_id: {
          tenantId: this.tenantId,
          id,
        },
      },
    });

    if (!row) return null;

    return {
      tenantId: row.tenantId,
      id: row.id,
      decisionId: row.decisionId,
      category: row.category,
      priority: row.priority,
      title: row.title,
      description: row.description,
      expectedImpact: row.expectedImpact,
      estimatedGain: row.estimatedGain,
      timeframe: row.timeframe,
      status: row.status as ActionProposalStatus,
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  async updateStatus(
    id: string,
    status: ActionProposalStatus,
    metadataUpdate?: Record<string, unknown>,
    expectedCurrentStatus?: ActionProposalStatus,
    tx?: any
  ): Promise<boolean> {
    const client = tx || this.prisma;
    const existing = await this.find(id);
    if (!existing) {
      return false;
    }

    const whereClause: any = {
      tenantId: this.tenantId,
      id,
    };

    if (expectedCurrentStatus) {
      whereClause.status = expectedCurrentStatus;
    }

    const mergedMetadata = {
      ...(existing.metadata as any),
      ...(metadataUpdate || {}),
    };

    const result = await (client as any).actionProposalRecord.updateMany({
      where: whereClause,
      data: {
        status,
        metadata: mergedMetadata,
      },
    });

    return (result?.count ?? 0) > 0;
  }

  async listByDecision(decisionId: string): Promise<ActionProposalRecord[]> {
    const rows = await (this.prisma as any).actionProposalRecord.findMany({
      where: {
        tenantId: this.tenantId,
        decisionId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row: any) => ({
      tenantId: row.tenantId,
      id: row.id,
      decisionId: row.decisionId,
      category: row.category,
      priority: row.priority,
      title: row.title,
      description: row.description,
      expectedImpact: row.expectedImpact,
      estimatedGain: row.estimatedGain,
      timeframe: row.timeframe,
      status: row.status as ActionProposalStatus,
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async list(): Promise<ActionProposalRecord[]> {
    const rows = await (this.prisma as any).actionProposalRecord.findMany({
      where: {
        tenantId: this.tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row: any) => ({
      tenantId: row.tenantId,
      id: row.id,
      decisionId: row.decisionId,
      category: row.category,
      priority: row.priority,
      title: row.title,
      description: row.description,
      expectedImpact: row.expectedImpact,
      estimatedGain: row.estimatedGain,
      timeframe: row.timeframe,
      status: row.status as ActionProposalStatus,
      metadata: (row.metadata as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async count(): Promise<number> {
    return await (this.prisma as any).actionProposalRecord.count({
      where: {
        tenantId: this.tenantId,
      },
    });
  }

  async clear(): Promise<void> {
    await (this.prisma as any).actionProposalRecord.deleteMany({
      where: {
        tenantId: this.tenantId,
      },
    });
  }
}
