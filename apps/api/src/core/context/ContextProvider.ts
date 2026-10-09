import { FastifyRequest } from 'fastify';
import { prisma } from '../../database/prisma';

export interface ElectoralContext {
  accountId: string;
  tenantId: string;
  accountType: string;
  politicalProfile: any;
  electionInterests: any[];
  defaultElectionInterest: any | null;
  automaticFilters: any[];
  geographicContext: {
    uf: string | null;
    cityCode: number | null;
    zones: number[];
  };
  candidateContext: {
    candidateName: string | null;
    candidateNumber: string | null;
    role: string | null;
    party: string | null;
  };
  partyContext: {
    partyAcronyms: string[];
  };
}

export class ContextProvider {
  /**
   * Resolve o contexto político a partir da request Fastify
   */
  static async resolveFromRequest(request: FastifyRequest): Promise<ElectoralContext> {
    const accountId = request.tenantId;
    if (!accountId) {
      throw new Error('Tenant ID não encontrado no contexto da requisição.');
    }
    return this.resolveByAccountId(accountId);
  }

  /**
   * Resolve o contexto político a partir do ID da conta (Account ID)
   */
  static async resolveByAccountId(accountId: string): Promise<ElectoralContext> {
    // Busca a conta e todos os seus relacionamentos relacionados ao perfil político e interesse
    const account = await prisma.account.findUnique({
      where: { id: accountId, isActive: true },
      include: {
        politicalProfile: true,
        electionInterests: true,
        automaticFilters: true,
      },
    });

    if (!account) {
      throw new Error(`Conta ativa não encontrada para o ID: ${accountId}`);
    }

    // Identificar a eleição de interesse padrão (preferencialmente a mais recente)
    const sortedInterests = [...account.electionInterests].sort((a, b) => b.year - a.year);
    const defaultElectionInterest = sortedInterests.length > 0 ? sortedInterests[0] : null;

    // Construir contextos simplificados
    const geographicContext = {
      uf: account.politicalProfile?.uf || null,
      cityCode: account.politicalProfile?.cityCode || null,
      zones: [] as number[],
    };

    // Extrair zonas de filtros geográficos se configurados
    account.automaticFilters.forEach((filter) => {
      if (filter.filterType === 'GEOGRAPHIC') {
        if (filter.field === 'uf' && !geographicContext.uf) {
          geographicContext.uf = filter.value;
        }
        if (filter.field === 'cityCode' && !geographicContext.cityCode) {
          geographicContext.cityCode = Number(filter.value);
        }
        if (filter.field === 'zoneNumber') {
          try {
            const parsed = JSON.parse(filter.value);
            if (Array.isArray(parsed)) {
              geographicContext.zones.push(...parsed.map(Number));
            } else {
              geographicContext.zones.push(Number(parsed));
            }
          } catch {
            geographicContext.zones.push(Number(filter.value));
          }
        }
      }
    });

    const candidateContext = {
      candidateName: account.politicalProfile?.candidateName || null,
      candidateNumber: account.politicalProfile?.candidateNumber || null,
      role: account.politicalProfile?.role || null,
      party: account.politicalProfile?.party || null,
    };

    const partyContext = {
      partyAcronyms: [] as string[],
    };

    if (account.politicalProfile?.party) {
      partyContext.partyAcronyms.push(account.politicalProfile.party);
    }

    return {
      accountId: account.id,
      tenantId: account.id, // tenantId mapeado para o ID da conta
      accountType: account.type,
      politicalProfile: account.politicalProfile,
      electionInterests: account.electionInterests,
      defaultElectionInterest,
      automaticFilters: account.automaticFilters,
      geographicContext,
      candidateContext,
      partyContext,
    };
  }

  /**
   * Constrói o contexto refinado de filtros SQL/Prisma prontos para uso em queries
   */
  static buildElectoralQueryContext(context: ElectoralContext) {
    const where: any = {};

    // Filtro básico de UF se especificado
    if (context.geographicContext.uf) {
      where.uf = context.geographicContext.uf;
    }

    // Filtro básico de Município se especificado
    if (context.geographicContext.cityCode) {
      where.cityCode = context.geographicContext.cityCode;
    }

    return where;
  }
}
