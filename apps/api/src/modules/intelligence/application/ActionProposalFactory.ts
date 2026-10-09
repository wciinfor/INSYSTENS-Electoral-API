import * as crypto from 'crypto';
import { RecommendedAction } from '../../../core/decisions/RecommendedAction';
import { DecisionRecord } from '../domain/DecisionRecord';
import { ActionProposalRecord } from '../domain/ActionProposalRecord';

export class ActionProposalFactory {
  private static escapeField(val: string): string {
    return val.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  }

  /**
   * Gera uma chave canônica normalizada para a RecommendedAction.
   * A normalização garante independência de formatação e estabilidade semântica:
   * 1. Normalização Unicode NFC
   * 2. Tratamento consistente de case (lowercase) e trim
   * 3. Escape de caracteres de delimitação (evitando ambiguidades por injeção de colons)
   */
  static generateCanonicalKey(decisionId: string, action: RecommendedAction): string {
    const rawTitle = action.title || (action as any).action || '';
    const cleanTitle = this.escapeField(rawTitle.normalize('NFC').trim().toLowerCase());
    const cleanTimeframe = this.escapeField((action.timeframe || '').normalize('NFC').trim().toLowerCase());
    const cleanPriority = this.escapeField(String(action.priority || '').normalize('NFC').trim().toUpperCase());
    
    const rawGain = (action as any).estimatedGain;
    const parsedGain = typeof rawGain === 'number' ? rawGain : parseFloat(String(rawGain).replace(/[^0-9.-]/g, '')) || 0;
    const cleanGain = String(parsedGain);
    
    const cleanImpact = this.escapeField((action.expectedImpact || '').normalize('NFC').trim().toLowerCase());
    const cleanDecisionId = this.escapeField((decisionId || '').normalize('NFC').trim());

    return `${cleanDecisionId}::${cleanTitle}::${cleanTimeframe}::${cleanPriority}::${cleanGain}::${cleanImpact}`;
  }

  /**
   * Gera um hash semântico SHA-256 estável de 16 caracteres hexadecimais a partir da chave canônica.
   * Evita colisões mesmo para ações com títulos similares e independe da posição no array.
   */
  static generateSemanticHash(decisionId: string, action: RecommendedAction): string {
    const canonicalKey = this.generateCanonicalKey(decisionId, action);
    return crypto.createHash('sha256').update(canonicalKey, 'utf8').digest('hex').substring(0, 16);
  }

  /**
   * Constrói o identificador determinístico da proposta de ação.
   * Formato: act-{decisionIdEncurtado}-{hashSemantico}
   */
  static generateProposalId(decisionId: string, action: RecommendedAction): string {
    const safeDecisionPrefix = decisionId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 36);
    const hash = this.generateSemanticHash(decisionId, action);
    return `act-${safeDecisionPrefix}-${hash}`;
  }

  /**
   * Converte uma RecommendedAction individual de uma DecisionRecord em uma ActionProposalRecord.
   */
  static createProposal(decision: DecisionRecord, action: RecommendedAction): ActionProposalRecord {
    if (!decision || !decision.tenantId || !decision.id) {
      throw new Error('ActionProposalFactory: decision com tenantId e id válidos é obrigatória.');
    }
    const title = action.title || (action as any).action;
    if (!action || !title) {
      throw new Error('ActionProposalFactory: RecommendedAction com title é obrigatória.');
    }

    const proposalId = this.generateProposalId(decision.id, action);
    const now = new Date().toISOString();
    const rawGain = (action as any).estimatedGain;
    const parsedGain = typeof rawGain === 'number' ? rawGain : parseFloat(String(rawGain).replace(/[^0-9.-]/g, '')) || 0;

    return {
      tenantId: decision.tenantId,
      id: proposalId,
      decisionId: decision.id,
      category: decision.category,
      priority: String(action.priority || decision.priority),
      title,
      description: action.description || (action as any).action || '',
      expectedImpact: action.expectedImpact || '',
      estimatedGain: parsedGain,
      timeframe: action.timeframe || '',
      status: 'PROPOSED',
      metadata: {
        sourceDecisionId: decision.id,
        decisionConfidence: decision.confidence,
        decisionCategory: decision.category,
        relatedSignals: decision.relatedSignals || [],
        version: '1.0.0',
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Converte todas as recommendedActions de um DecisionRecord em uma coleção de propostas determinísticas.
   * É estritamente independente da ordem dos elementos no array de entrada.
   */
  static fromDecision(decision: DecisionRecord): ActionProposalRecord[] {
    if (!decision || !decision.recommendedActions || decision.recommendedActions.length === 0) {
      return [];
    }

    // Mapeia todas as propostas
    const proposals = decision.recommendedActions.map((action) => this.createProposal(decision, action));

    // Desduplica caso a decisão original contenha exatamente a mesma ação duplicada no array
    const uniqueMap = new Map<string, ActionProposalRecord>();
    for (const prop of proposals) {
      if (!uniqueMap.has(prop.id)) {
        uniqueMap.set(prop.id, prop);
      }
    }

    // Ordena determinísticamente por ID para garantir consistência total de lote
    return Array.from(uniqueMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  }
}
