import { Decision } from '../decisions/Decision';
import { DecisionPriority } from '../decisions/DecisionPriority';
import { DecisionCategory } from '../decisions/DecisionCategory';
import { StrategicTimeline } from './StrategicTimeline';
import { TimelineEvent } from './TimelineEvent';
import { TimelinePriority } from './TimelinePriority';
import { TimelineStatus } from './TimelineStatus';
import { TimelineRecommendation } from './TimelineRecommendation';

export class StrategicTimelineEngine {
  /**
   * Converte DecisionPriority/TimelinePriority em peso numérico para ordenação
   */
  private static getPriorityWeight(priority: string | TimelinePriority | DecisionPriority): number {
    switch (priority) {
      case 'URGENT':
      case TimelinePriority.URGENT:
      case DecisionPriority.URGENT:
        return 4;
      case 'HIGH':
      case TimelinePriority.HIGH:
      case DecisionPriority.HIGH:
        return 3;
      case 'MEDIUM':
      case TimelinePriority.MEDIUM:
      case DecisionPriority.MEDIUM:
        return 2;
      case 'LOW':
      case TimelinePriority.LOW:
      case DecisionPriority.LOW:
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Converte DecisionPriority para TimelinePriority
   */
  private static mapPriority(priority: DecisionPriority | string): TimelinePriority {
    switch (priority) {
      case DecisionPriority.URGENT:
      case 'URGENT':
        return TimelinePriority.URGENT;
      case DecisionPriority.HIGH:
      case 'HIGH':
        return TimelinePriority.HIGH;
      case DecisionPriority.MEDIUM:
      case 'MEDIUM':
        return TimelinePriority.MEDIUM;
      case DecisionPriority.LOW:
      case 'LOW':
      default:
        return TimelinePriority.LOW;
    }
  }

  /**
   * Auxiliar para manipulação determinística de datas (ISO String)
   */
  private static addDays(baseDateISO: string, days: number): string {
    const date = new Date(Date.parse(baseDateISO));
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Gera o StrategicTimeline a partir de uma lista de decisões
   */
  static generate(decisions: Decision[]): StrategicTimeline {
    const generatedAt = new Date().toISOString();
    
    if (!decisions || decisions.length === 0) {
      return {
        generatedAt,
        events: [],
        recommendations: [],
      };
    }

    const events: TimelineEvent[] = [];
    const baseDate = '2026-06-10T08:00:00.000Z'; // Data base fixa e estável no futuro

    // 1. Mapear cada RecommendedAction de cada Decision para um TimelineEvent
    decisions.forEach((decision) => {
      if (!decision.recommendedActions) return;

      decision.recommendedActions.forEach((action, idx) => {
        const priority = this.mapPriority(action.priority);
        const weight = this.getPriorityWeight(priority);

        // Planejar datas determinísticas com base na prioridade da ação
        let startOffset = 1;
        let durationDays = 2;
        let status = TimelineStatus.SUGGESTED;

        if (priority === TimelinePriority.URGENT) {
          startOffset = 1;
          durationDays = 2;
          status = TimelineStatus.PLANNED;
        } else if (priority === TimelinePriority.HIGH) {
          startOffset = 3;
          durationDays = 5;
          status = TimelineStatus.PLANNED;
        } else if (priority === TimelinePriority.MEDIUM) {
          startOffset = 8;
          durationDays = 7;
          status = TimelineStatus.SUGGESTED;
        } else {
          startOffset = 16;
          durationDays = 10;
          status = TimelineStatus.SUGGESTED;
        }

        const startDate = this.addDays(baseDate, startOffset + idx);
        const endDate = this.addDays(startDate, durationDays);

        events.push({
          id: `evt-${decision.category.toLowerCase()}-${idx}-${decision.id}`.substring(0, 80),
          title: action.title,
          summary: action.description,
          priority,
          status,
          startDate,
          endDate,
          expectedImpact: action.expectedImpact,
          relatedDecisionIds: [decision.id],
          metadata: {
            estimatedGain: action.estimatedGain,
            timeframe: action.timeframe,
            decisionCategory: decision.category,
          },
        });
      });
    });

    // 2. Ordenar eventos por prioridade (decrescente: URGENT -> LOW) e depois por startDate (crescente)
    events.sort((a, b) => {
      const weightA = this.getPriorityWeight(a.priority);
      const weightB = this.getPriorityWeight(b.priority);

      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return a.startDate.localeCompare(b.startDate);
    });

    // 3. Gerar recomendações executivas (TimelineRecommendation) baseadas nas decisões
    const recommendations: TimelineRecommendation[] = [];
    const categoriesPresent = new Set<DecisionCategory>(decisions.map(d => d.category));

    if (categoriesPresent.has(DecisionCategory.RISK)) {
      recommendations.push({
        title: 'Fidelização Imediata e Blindagem de Campo',
        description: 'Concentrar a agenda dos próximos 7 dias em reuniões privadas com lideranças históricas identificadas sob risco de concorrência.',
        reason: 'Evidência de avanço de campanhas opositoras e instabilidade nas bases tradicionais.',
        estimatedGain: 1000,
        confidence: 0.9,
      });
    }

    if (categoriesPresent.has(DecisionCategory.TERRITORIAL)) {
      recommendations.push({
        title: 'Planejamento de Roteiro de Expansão Física',
        description: 'Mapear e aprovar um cronograma de visitas comunitárias para as seções e bairros periféricos de alta vulnerabilidade territorial.',
        reason: 'Presença territorial vulnerável com ausência de líderes regionais monitorados.',
        estimatedGain: 1500,
        confidence: 0.85,
      });
    }

    if (categoriesPresent.has(DecisionCategory.GROWTH)) {
      recommendations.push({
        title: 'Campanha Digital e Segmentação de Conteúdo',
        description: 'Lançar tráfego pago focado e anúncios regionais direcionados a zonas eleitorais prioritárias com alta abstenção e potencial de atração.',
        reason: 'Presença de bolsões de eleitores jovens e sem representação nominal estabelecida.',
        estimatedGain: 2500,
        confidence: 0.8,
      });
    }

    // Recomendação padrão/estratégica se a lista for vazia ou diferente
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Alinhamento Estratégico Multidisciplinar',
        description: 'Agendar sessão executiva com a coordenação de campanha para consolidar as metas e calibrar o comitê.',
        reason: 'Manutenção periódica da integridade das metas do mandato.',
        estimatedGain: 500,
        confidence: 0.95,
      });
    }

    return {
      generatedAt,
      events,
      recommendations,
    };
  }
}
