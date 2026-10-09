import { DecisionAuditEvent, IDecisionAuditTrail } from './IDecisionAuditTrail';

export class InMemoryDecisionAuditTrail implements IDecisionAuditTrail {
  private events: DecisionAuditEvent[] = [];

  async record(event: DecisionAuditEvent): Promise<void> {
    if (!event.tenantId || typeof event.tenantId !== 'string' || event.tenantId.trim() === '') {
      throw new Error('InMemoryDecisionAuditTrail: tenantId é obrigatório para registrar evento de auditoria.');
    }

    const auditEvent: DecisionAuditEvent = {
      ...event,
      id: event.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      relatedSignals: event.relatedSignals ? [...event.relatedSignals] : [],
      details: event.details ? { ...event.details } : {},
    };

    // Eventos de auditoria são imutáveis: append-only
    this.events.push(auditEvent);
  }

  async recordMany(events: DecisionAuditEvent[]): Promise<void> {
    for (const ev of events) {
      await this.record(ev);
    }
  }

  async listByTenant(tenantId: string): Promise<DecisionAuditEvent[]> {
    return this.events
      .filter((ev) => ev.tenantId === tenantId)
      .map((ev) => ({ ...ev }));
  }

  async listByDecision(tenantId: string, decisionId: string): Promise<DecisionAuditEvent[]> {
    return this.events
      .filter((ev) => ev.tenantId === tenantId && ev.decisionId === decisionId)
      .map((ev) => ({ ...ev }));
  }

  async count(tenantId: string): Promise<number> {
    return this.events.filter((ev) => ev.tenantId === tenantId).length;
  }

  async clear(tenantId: string): Promise<void> {
    this.events = this.events.filter((ev) => ev.tenantId !== tenantId);
  }
}
