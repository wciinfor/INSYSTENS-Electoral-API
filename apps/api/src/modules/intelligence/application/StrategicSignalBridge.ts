import { StrategicSignalRecord } from '@prisma/client';
import { StrategicSignal as CoreStrategicSignal } from '../../../core/signals/Signal';
import { SignalCategory } from '../../../core/signals/SignalCategory';
import { SignalPriority } from '../../../core/signals/SignalPriority';
import { SignalStatus } from '../../../core/signals/SignalStatus';
import { SignalTrend } from '../../../core/signals/SignalTrend';
import { StrategicSignal as Sprint55Signal } from '../../strategic-signals/domain/StrategicSignal';

export interface SignalSourceInput {
  tenantId: string;
  id: string;
  type: string;
  severity: string;
  confidence: number;
  context: Record<string, unknown> | any;
  reason: string;
  metadata?: Record<string, unknown> | any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class StrategicSignalBridge {
  /**
   * Mapeia a severidade do Sprint 5.5 ('low', 'medium', 'high', 'critical')
   * para o SignalPriority do Core (LOW, MEDIUM, HIGH, URGENT).
   */
  static mapPriority(severity: string): SignalPriority {
    switch (severity.toLowerCase()) {
      case 'critical':
        return SignalPriority.URGENT;
      case 'high':
        return SignalPriority.HIGH;
      case 'medium':
        return SignalPriority.MEDIUM;
      case 'low':
      default:
        return SignalPriority.LOW;
    }
  }

  /**
   * Mapeia o tipo de sinal do Sprint 5.5 para a SignalCategory do Core.
   * Retorna null se for um tipo não suportado ou desconhecido.
   */
  static mapCategory(type: string): SignalCategory | null {
    switch (type) {
      case 'territorial_opportunity':
        return SignalCategory.TERRITORIAL;
      case 'orphan_node':
        return SignalCategory.RISK;
      case 'high_relationship_density':
        return SignalCategory.STRATEGIC;
      default:
        return null;
    }
  }

  /**
   * Mapeia o status do sinal com base na severidade e tipo.
   */
  static mapStatus(severity: string): SignalStatus {
    switch (severity.toLowerCase()) {
      case 'critical':
        return SignalStatus.CRITICAL;
      case 'high':
        return SignalStatus.ATTENTION;
      case 'medium':
        return SignalStatus.NEUTRAL;
      case 'low':
      default:
        return SignalStatus.POSITIVE;
    }
  }

  /**
   * Gera o título explicativo e determinístico baseado no tipo e contexto do sinal.
   */
  static generateTitle(type: string, id: string): string {
    switch (type) {
      case 'territorial_opportunity':
        return 'Oportunidade de Expansão Territorial';
      case 'orphan_node':
        return 'Alerta de Nó Isolado na Rede (Risco de Desarticulação)';
      case 'high_relationship_density':
        return 'Alta Concentração de Conexões Estratégicas';
      default:
        return `Sinal Estratégico (${type})`;
    }
  }

  /**
   * Converte um registro de sinal (StrategicSignalRecord ou Sprint55Signal)
   * no contrato StrategicSignal esperado pelo Core.
   * Se o sinal pertencer a outro tenant ou se for um tipo desconhecido, retorna null.
   */
  static toCoreSignal(
    signal: SignalSourceInput | StrategicSignalRecord | Sprint55Signal,
    expectedTenantId: string
  ): CoreStrategicSignal | null {
    if (!signal) {
      return null;
    }

    const tenantId = (signal as any).tenantId || (signal as any).metadata?.tenantId;
    if (tenantId && tenantId !== expectedTenantId) {
      return null;
    }

    const category = this.mapCategory(signal.type);
    if (!category) {
      // Tipo desconhecido ou não mapeável: emite alerta estruturado observável e descarta com segurança
      console.warn(
        `[StrategicSignalBridge] Warning: Sinal ignorado por tipo desconhecido/não suportado. ID=${signal.id}, Tipo=${signal.type}, Tenant=${expectedTenantId}`
      );
      return null;
    }

    const priority = this.mapPriority(signal.severity);
    const status = this.mapStatus(signal.severity);
    const title = this.generateTitle(signal.type, signal.id);
    const contextObj = (signal.context as Record<string, unknown>) || {};
    const metadataObj = (signal.metadata as Record<string, unknown>) || {};

    const anySignal = signal as any;
    const generatedAt =
      anySignal.createdAt instanceof Date
        ? anySignal.createdAt.toISOString()
        : typeof anySignal.createdAt === 'string'
        ? anySignal.createdAt
        : metadataObj.createdAt
        ? String(metadataObj.createdAt)
        : new Date().toISOString();

    return {
      id: signal.id,
      code: signal.type.toUpperCase(),
      title,
      category,
      status,
      priority,
      trend: SignalTrend.UNKNOWN, // Fato estrutural: sem histórico de série temporal prévio no Sprint 5.5
      confidence: typeof signal.confidence === 'number' ? signal.confidence : 1.0,
      score: 0, // Score numérico não existe no Sprint 5.5; 0 evita invenção
      summary: signal.reason,
      explanation: {
        title,
        summary: signal.reason,
        details: `Sinal topológico derivado do Knowledge Graph. Contexto: ${JSON.stringify(contextObj)}`,
        factors: Object.keys(contextObj),
        confidence: typeof signal.confidence === 'number' ? signal.confidence : 1.0,
      },
      recommendedActions: [], // Ações recomendadas serão geradas soberanamente pelo DecisionEngine
      relatedFactors: Object.keys(contextObj),
      algorithm: metadataObj.source ? String(metadataObj.source) : 'knowledge-graph-topology',
      algorithmVersion: metadataObj.version ? String(metadataObj.version) : '1.0.0',
      generatedAt,
      metadata: {
        tenantId: expectedTenantId,
        source: metadataObj.source,
        originalType: signal.type,
        originalSeverity: signal.severity,
        context: contextObj,
      },
    };
  }

  /**
   * Converte uma coleção de sinais para o contrato do Core,
   * filtrando estritamente pelo tenant solicitado e descartando tipos não suportados.
   */
  static toCoreSignals(
    signals: Array<SignalSourceInput | StrategicSignalRecord | Sprint55Signal>,
    tenantId: string
  ): CoreStrategicSignal[] {
    if (!tenantId) {
      throw new Error('StrategicSignalBridge: tenantId é obrigatório para conversão de sinais.');
    }
    if (!signals || signals.length === 0) {
      return [];
    }

    const converted: CoreStrategicSignal[] = [];
    for (const sig of signals) {
      const coreSig = this.toCoreSignal(sig, tenantId);
      if (coreSig) {
        converted.push(coreSig);
      }
    }

    return converted;
  }
}
