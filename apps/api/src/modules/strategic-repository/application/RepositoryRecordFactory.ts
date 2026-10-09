import * as crypto from 'crypto';
import { MappedRecord } from '../../data-platform/domain/MappedRecord';
import { RepositoryRecord, RepositoryEntityType } from '../domain/RepositoryRecord';

export class RepositoryRecordFactory {
  /**
   * Serialização canônica determinística para objetos e primitivos.
   * Ordena recursivamente as chaves de objetos para garantir que objetos
   * com as mesmas propriedades produzam a mesma string independente da ordem.
   */
  private static canonicalStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return String(value);
    }
    if (typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return '[' + value.map((item) => this.canonicalStringify(item)).join(',') + ']';
    }
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${this.canonicalStringify(obj[key])}`
    );
    return '{' + parts.join(',') + '}';
  }

  /**
   * Gera um ID determinístico estável baseado em:
   * 1. metadata.id ou metadata.externalId se fornecidos;
   * 2. Hash SHA-256 estável de [entity, source, canonicalDataPayload].
   */
  static generateDeterministicId(
    entity: string,
    source: string,
    data: Record<string, unknown>
  ): string {
    const canonicalPayload = this.canonicalStringify(data || {});
    const hash = crypto
      .createHash('sha256')
      .update(`${entity}:${source}:${canonicalPayload}`)
      .digest('hex');

    return `${entity}_${hash.substring(0, 16)}`;
  }

  /**
   * Converte um MappedRecord em RepositoryRecord de forma pura e determinística.
   */
  static fromMappedRecord(
    mapped: MappedRecord,
    customId?: string
  ): RepositoryRecord {
    const supportedEntities: RepositoryEntityType[] = [
      'generic',
      'candidate',
      'party',
      'municipality',
      'election',
      'vote',
    ];

    const entity: RepositoryEntityType = supportedEntities.includes(
      mapped.entity as RepositoryEntityType
    )
      ? (mapped.entity as RepositoryEntityType)
      : 'generic';

    let id: string;

    if (customId && typeof customId === 'string' && customId.trim().length > 0) {
      id = customId.trim();
    } else if (
      mapped.metadata?.id &&
      typeof mapped.metadata.id === 'string' &&
      mapped.metadata.id.trim().length > 0
    ) {
      id = mapped.metadata.id.trim();
    } else if (
      mapped.metadata?.externalId &&
      typeof mapped.metadata.externalId === 'string' &&
      mapped.metadata.externalId.trim().length > 0
    ) {
      id = `${entity}_${mapped.metadata.externalId.trim()}`;
    } else {
      id = this.generateDeterministicId(entity, mapped.source, mapped.data || {});
    }

    const metadata: Record<string, any> = {
      ...(mapped.metadata || {}),
      confidence: typeof mapped.confidence === 'number' ? mapped.confidence : 1.0,
      version: mapped.metadata?.version || '1.0.0',
    };

    return {
      id,
      entity,
      source: mapped.source,
      data: { ...(mapped.data || {}) },
      metadata,
      createdAt: new Date().toISOString(),
    };
  }
}
