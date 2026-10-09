import { StrategicSignal } from '../signals/Signal';
import { SignalCategory } from '../signals/SignalCategory';
import { SignalPriority } from '../signals/SignalPriority';
import { Decision } from './Decision';
import { DecisionCategory } from './DecisionCategory';
import { DecisionPriority } from './DecisionPriority';
import { DecisionReason } from './DecisionReason';
import { RecommendedAction } from './RecommendedAction';

export class DecisionEngine {
  /**
   * Converte o SignalPriority em uma representação numérica para ordenação e cálculo de prioridade máxima
   */
  private static getPriorityWeight(priority: SignalPriority | DecisionPriority | string): number {
    switch (priority) {
      case 'URGENT':
      case SignalPriority.URGENT:
      case DecisionPriority.URGENT:
        return 4;
      case 'HIGH':
      case SignalPriority.HIGH:
      case DecisionPriority.HIGH:
        return 3;
      case 'MEDIUM':
      case SignalPriority.MEDIUM:
      case DecisionPriority.MEDIUM:
        return 2;
      case 'LOW':
      case SignalPriority.LOW:
      case DecisionPriority.LOW:
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Converte um peso numérico de volta para DecisionPriority
   */
  private static getDecisionPriorityFromWeight(weight: number): DecisionPriority {
    if (weight >= 4) return DecisionPriority.URGENT;
    if (weight === 3) return DecisionPriority.HIGH;
    if (weight === 2) return DecisionPriority.MEDIUM;
    return DecisionPriority.LOW;
  }

  /**
   * Converte a prioridade de uma ação de sinal para DecisionPriority
   */
  private static mapActionPriority(priority: string): DecisionPriority {
    switch (priority) {
      case 'URGENT':
        return DecisionPriority.URGENT;
      case 'HIGH':
        return DecisionPriority.HIGH;
      case 'MEDIUM':
        return DecisionPriority.MEDIUM;
      case 'LOW':
        return DecisionPriority.LOW;
      default:
        return DecisionPriority.MEDIUM;
    }
  }

  /**
   * Mapeia SignalCategory para DecisionCategory
   */
  private static mapCategory(signalCat: SignalCategory): DecisionCategory {
    switch (signalCat) {
      case SignalCategory.TERRITORIAL:
        return DecisionCategory.TERRITORIAL;
      case SignalCategory.RISK:
        return DecisionCategory.RISK;
      case SignalCategory.GROWTH:
        return DecisionCategory.GROWTH;
      case SignalCategory.ENGAGEMENT:
        return DecisionCategory.ENGAGEMENT;
      case SignalCategory.LEADERSHIP:
        return DecisionCategory.LEADERSHIP;
      case SignalCategory.CAMPAIGN:
        return DecisionCategory.CAMPAIGN;
      case SignalCategory.STRATEGIC:
      case SignalCategory.AI:
      default:
        return DecisionCategory.STRATEGIC;
    }
  }

  /**
   * Gera títulos e resumos determinísticos baseados na DecisionCategory
   */
  private static getDecisionTemplate(category: DecisionCategory): { title: string; summary: string } {
    switch (category) {
      case DecisionCategory.TERRITORIAL:
        return {
          title: 'Otimização e Expansão Territorial',
          summary: 'Consolidação e proteção de bases históricas com expansão cirúrgica em áreas limítrofes vulneráveis.',
        };
      case DecisionCategory.RISK:
        return {
          title: 'Mitigação e Contenção de Riscos Políticos',
          summary: 'Intervenção imediata em áreas sob ameaça de avanço da oposição ou perda de fidelidade de lideranças.',
        };
      case DecisionCategory.GROWTH:
        return {
          title: 'Campanha de Aceleração e Crescimento',
          summary: 'Exploração de oportunidades de captação de votos identificadas em bolsões de abstenção ou sem representação.',
        };
      case DecisionCategory.ENGAGEMENT:
        return {
          title: 'Campanha de Engajamento e Mobilização',
          summary: 'Ações de comunicação e mobilização digital e presencial para elevar a conexão com o eleitorado.',
        };
      case DecisionCategory.LEADERSHIP:
        return {
          title: 'Alinhamento e Fortalecimento de Lideranças',
          summary: 'Aproximação estratégica com cabos eleitorais e lideranças de bairros para blindagem do território.',
        };
      case DecisionCategory.CAMPAIGN:
        return {
          title: 'Direcionamento de Recursos de Campanha',
          summary: 'Ajuste fino na alocação orçamentária e logística baseado em score de retorno eleitoral.',
        };
      case DecisionCategory.STRATEGIC:
      default:
        return {
          title: 'Direcionamento Estratégico Consolidado',
          summary: 'Medidas corporativas e estratégicas para manter a saúde geral do mandato e viabilidade política.',
        };
    }
  }

  /**
   * Processa uma lista de StrategicSignal e gera decisões acionáveis e mockadas de forma determinística
   */
  static generateFromSignals(signals: StrategicSignal[]): Decision[] {
    if (!signals || signals.length === 0) {
      return [];
    }

    // 1. Agrupar sinais por DecisionCategory
    const groups = new Map<DecisionCategory, StrategicSignal[]>();

    for (const signal of signals) {
      const decisionCat = this.mapCategory(signal.category);
      if (!groups.has(decisionCat)) {
        groups.set(decisionCat, []);
      }
      groups.get(decisionCat)!.push(signal);
    }

    const decisions: Decision[] = [];
    const generatedAt = new Date().toISOString();

    // 2. Criar uma decisão para cada categoria que possui sinais
    groups.forEach((signalsInCategory, category) => {
      // Encontrar a prioridade máxima na categoria
      let maxPriorityWeight = 0;
      let totalConfidence = 0;
      const relatedSignals: string[] = [];

      for (const sig of signalsInCategory) {
        const weight = this.getPriorityWeight(sig.priority);
        if (weight > maxPriorityWeight) {
          maxPriorityWeight = weight;
        }
        totalConfidence += sig.confidence;
        relatedSignals.push(sig.id);
      }

      const priority = this.getDecisionPriorityFromWeight(maxPriorityWeight);
      const avgConfidence = totalConfidence / signalsInCategory.length;
      const template = this.getDecisionTemplate(category);

      // Mapear razões (Reasons)
      const reasons: DecisionReason[] = signalsInCategory.map(sig => ({
        title: sig.explanation?.title || `Sinal Analítico: ${sig.title}`,
        description: sig.explanation?.summary || sig.summary,
        evidence: sig.explanation?.details || `Score calculado de ${sig.score}.`,
        weight: sig.confidence,
      }));

      // Mapear ações recomendadas (RecommendedActions)
      const recommendedActions: RecommendedAction[] = [];
      let totalEstimatedGain = 0;

      for (const sig of signalsInCategory) {
        if (sig.recommendedActions) {
          for (const act of sig.recommendedActions) {
            const actPriority = this.mapActionPriority(act.priority);
            
            // Timeframe determinístico baseado na prioridade da ação
            let timeframe = 'Médio Prazo (15-30 dias)';
            if (actPriority === DecisionPriority.URGENT) {
              timeframe = 'Imediato (24-48h)';
            } else if (actPriority === DecisionPriority.HIGH) {
              timeframe = 'Curto Prazo (7 dias)';
            }

            recommendedActions.push({
              title: act.title,
              description: act.description,
              priority: actPriority,
              expectedImpact: act.expectedImpact,
              estimatedGain: act.estimatedGain,
              timeframe,
            });

            totalEstimatedGain += act.estimatedGain;
          }
        }
      }

      const expectedImpact = `Consolidação da categoria ${category}. Estima-se um ganho potencial cumulativo de até ${totalEstimatedGain} votos com a execução das recomendações.`;

      decisions.push({
        id: `dec-${category.toLowerCase()}-${generatedAt.substring(0, 10)}-${relatedSignals.join('-')}`.substring(0, 80),
        title: template.title,
        summary: template.summary,
        category,
        priority,
        reasons,
        recommendedActions,
        expectedImpact,
        confidence: Number(avgConfidence.toFixed(2)),
        relatedSignals,
        generatedAt,
      });
    });

    // 3. Ordenar decisões por priority: URGENT > HIGH > MEDIUM > LOW
    return decisions.sort((a, b) => {
      const weightA = this.getPriorityWeight(a.priority);
      const weightB = this.getPriorityWeight(b.priority);
      return weightB - weightA; // Decrescente
    });
  }
}
