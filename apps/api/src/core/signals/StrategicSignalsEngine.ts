import { ScoreResult } from '../kernel/types';
import { StrategicSignal } from './Signal';
import { SignalCategory } from './SignalCategory';
import { SignalStatus } from './SignalStatus';
import { SignalPriority } from './SignalPriority';
import { SignalTrend } from './SignalTrend';

export class StrategicSignalsEngine {
  /**
   * Converte uma lista de ScoreResult em StrategicSignals
   */
  static convertScores(scores: ScoreResult[]): StrategicSignal[] {
    return scores.map(score => this.convert(score));
  }

  /**
   * Converte um ScoreResult individual em um StrategicSignal rico, explicável e acionável
   */
  static convert(scoreResult: ScoreResult): StrategicSignal {
    const code = scoreResult.code.toUpperCase();
    const generatedAt = new Date().toISOString();

    // Defaults
    let category = SignalCategory.STRATEGIC;
    let status = SignalStatus.NEUTRAL;
    let priority = SignalPriority.MEDIUM;
    let trend = SignalTrend.STABLE;
    let title = `Sinal de ${scoreResult.name}`;
    let summary = scoreResult.explanation;
    let details = 'Detalhes operacionais sobre o score analítico.';
    let factors = ['Fatores demográficos', 'Lideranças ativas'];
    let recommendedActions: any[] = [];
    let relatedFactors = factors;

    // Conversores Específicos por código de Score
    if (code === 'ISI') {
      category = SignalCategory.STRATEGIC;
      title = 'INSYSTENS Strategic Index';
      trend = SignalTrend.UP;
      
      if (scoreResult.score >= 700) {
        status = SignalStatus.POSITIVE;
        priority = SignalPriority.MEDIUM;
        summary = 'Sua saúde política e territorial consolidada aponta para um desempenho estável e seguro.';
        details = 'O índice ISI aponta que a combinação de forte presença territorial (TCS) com baixos índices de concorrência (PRS) posiciona a conta de forma favorável.';
      } else if (scoreResult.score >= 500) {
        status = SignalStatus.NEUTRAL;
        priority = SignalPriority.HIGH;
        summary = 'Sua campanha possui pontos fortes, mas necessita de atenção em áreas de expansão.';
        details = 'Sinal neutro do ISI sugerindo gargalos na consolidação do eleitorado periférico.';
      } else {
        status = SignalStatus.ATTENTION;
        priority = SignalPriority.URGENT;
        summary = 'Alerta de saúde política baixa. Risco de queda de intenção de votos no território.';
        details = 'ISI sob risco crítico gerado pelo avanço da oposição.';
      }

      recommendedActions = [
        {
          title: 'Auditar bases eleitorais com líderes locais',
          description: 'Reunir comitê técnico para mapear focos de baixa capilaridade.',
          expectedImpact: 'HIGH',
          priority: 'URGENT',
          estimatedGain: 1200,
        }
      ];
    } else if (code === 'TCS') {
      category = SignalCategory.TERRITORIAL;
      title = 'Territory Confidence Score';
      trend = SignalTrend.STABLE;

      if (scoreResult.score >= 60) {
        status = SignalStatus.POSITIVE;
        priority = SignalPriority.LOW;
        summary = 'Sua presença territorial encontra-se consolidada no estado principal de atuação.';
        details = 'Presença consolidada através de líderes e cabos ativos em mais de 80% das seções monitoradas.';
        factors = ['Alta densidade de lideranças', 'Presença constante', 'Baixa concorrência'];
      } else {
        status = SignalStatus.ATTENTION;
        priority = SignalPriority.HIGH;
        summary = 'Presença territorial vulnerável. Necessidade de expansão de campo.';
        details = 'Vulnerabilidade territorial por ausência de líderes regionais ativos.';
        factors = ['Baixa densidade de líderes', 'Zonas desprotegidas'];
      }

      recommendedActions = [
        {
          title: 'Fortalecer agendas institucionais',
          description: 'Agendar visitas em locais com lideranças estabelecidas para manter base engajada.',
          expectedImpact: 'MEDIUM',
          priority: 'HIGH',
          estimatedGain: 800,
        },
        {
          title: 'Expandir presença em municípios vizinhos',
          description: 'Recrutar líderes comunitários em cidades limítrofes prioritárias.',
          expectedImpact: 'HIGH',
          priority: 'MEDIUM',
          estimatedGain: 1500,
        }
      ];
    } else if (code === 'GOS') {
      category = SignalCategory.GROWTH;
      title = 'Growth Opportunity Score';
      trend = SignalTrend.UP;

      if (scoreResult.score >= 70) {
        status = SignalStatus.VERY_POSITIVE;
        priority = SignalPriority.HIGH;
        summary = 'Identificado forte potencial de atração de votos em zonas de expansão prioritárias.';
        details = 'GOS elevado indicando bolsões de eleitores sem representação direta e abstenção reversível.';
        factors = ['Eleitorado jovem sem representação', 'Histórico de votos favorável à coligação'];
      } else {
        status = SignalStatus.NEUTRAL;
        priority = SignalPriority.LOW;
        summary = 'Margem de crescimento orgânico estável nas regiões atuais.';
        details = 'Baixa presença de novos eleitores em potencial nas zonas monitoradas.';
      }

      recommendedActions = [
        {
          title: 'Campanha de panfletagem digital focada',
          description: 'Direcionar esforços de comunicação localizados para as zonas com GOS elevado.',
          expectedImpact: 'TRANSFORMATIVE',
          priority: 'HIGH',
          estimatedGain: 2500,
        }
      ];
    } else if (code === 'PRS') {
      category = SignalCategory.RISK;
      title = 'Political Risk Score';
      trend = SignalTrend.STABLE;

      if (scoreResult.score >= 50) {
        status = SignalStatus.CRITICAL;
        priority = SignalPriority.URGENT;
        summary = 'Alerta Crítico: Avanço acelerado de concorrência e riscos de abstenção em reduto eleitoral.';
        details = 'Aumento repentino no PRS indica sobreposição de bases de candidatos concorrentes.';
        factors = ['Campanhas opositoras agressivas', 'Insatisfação de líderes locais'];
      } else {
        status = SignalStatus.POSITIVE; // Baixo risco = positivo
        priority = SignalPriority.LOW;
        summary = 'Cenário de riscos políticos sob controle na região principal.';
        details = 'Pouca movimentação de candidatos concorrentes e base de líderes leal.';
      }

      recommendedActions = [
        {
          title: 'Blindar bases e fidelizar lideranças',
          description: 'Realizar reuniões de prestação de contas com líderes de redutos tradicionais.',
          expectedImpact: 'HIGH',
          priority: 'HIGH',
          estimatedGain: 1000,
        }
      ];
    }

    return {
      id: `sig-${code.toLowerCase()}-${generatedAt}`,
      code,
      title,
      category,
      status,
      priority,
      trend,
      confidence: scoreResult.confidence,
      score: scoreResult.score,
      summary,
      explanation: {
        title: `Por que o ${title} é de ${scoreResult.score}?`,
        summary,
        details,
        factors,
        confidence: scoreResult.confidence,
      },
      recommendedActions,
      relatedFactors,
      algorithm: scoreResult.metadata?.formula || 'Fórmula Linear baseada em contexto',
      algorithmVersion: '1.0.0',
      generatedAt,
      metadata: scoreResult.metadata,
    };
  }
}
