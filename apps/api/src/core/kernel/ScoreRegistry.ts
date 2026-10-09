import { PoliticalIntelligenceContext, ScoreEngine, ScoreResult } from './types';

export class ScoreRegistry {
  private static engines: Map<string, ScoreEngine> = new Map();

  static register(engine: ScoreEngine) {
    this.engines.set(engine.code.toUpperCase(), engine);
  }

  static get(code: string): ScoreEngine | undefined {
    return this.engines.get(code.toUpperCase());
  }

  static executeAll(context: PoliticalIntelligenceContext): ScoreResult[] {
    const results: ScoreResult[] = [];
    for (const engine of this.engines.values()) {
      results.push(engine.calculate(context));
    }
    return results;
  }
}

// Helper para categorizar níveis com base em faixas (0 a 100)
function categorizeLevel(score: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
  if (score < 20) return 'VERY_LOW';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 80) return 'HIGH';
  return 'VERY_HIGH';
}

// 1. TCS - Territory Confidence Score
ScoreRegistry.register({
  code: 'TCS',
  name: 'Territory Confidence Score',
  calculate(context: PoliticalIntelligenceContext): ScoreResult {
    const defaultScore = 65; // Base mockada
    return {
      code: 'TCS',
      name: 'Territory Confidence Score',
      score: defaultScore,
      level: categorizeLevel(defaultScore),
      confidence: 0.85,
      explanation: `Mede a solidez e a capilaridade da presença física da conta no estado de ${context.geographicContext.uf || 'SP'}. Indica boa base de lideranças ativas.`,
      metadata: {
        activeLeadersCount: 45,
        monitoredLocationsCount: 12,
      },
    };
  },
});

// 2. GOS - Growth Opportunity Score
ScoreRegistry.register({
  code: 'GOS',
  name: 'Growth Opportunity Score',
  calculate(context: PoliticalIntelligenceContext): ScoreResult {
    const defaultScore = 78;
    return {
      code: 'GOS',
      name: 'Growth Opportunity Score',
      score: defaultScore,
      level: categorizeLevel(defaultScore),
      confidence: 0.90,
      explanation: 'Indica alto potencial de expansão eleitoral com base no cruzamento de dados demográficos de regiões adjacentes sem líderes cadastrados.',
      metadata: {
        highPriorityZonesCount: 3,
        estimatedTargetAudience: 36200,
      },
    };
  },
});

// 3. PRS - Political Risk Score
ScoreRegistry.register({
  code: 'PRS',
  name: 'Political Risk Score',
  calculate(context: PoliticalIntelligenceContext): ScoreResult {
    const defaultScore = 32;
    return {
      code: 'PRS',
      name: 'Political Risk Score',
      score: defaultScore,
      level: categorizeLevel(defaultScore),
      confidence: 0.75,
      explanation: 'Avalia o nível de risco de perda de terreno político para candidaturas concorrentes e taxa de abstenção esperada na região geográfica de atuação.',
      metadata: {
        competitorOverlappingPercentage: 15.4,
        projectedAbstentionRate: 21.3,
      },
    };
  },
});

// 4. ISI - INSYSTENS Strategic Index (Alcântara Sistemas proprietary index: 0 a 1000)
ScoreRegistry.register({
  code: 'ISI',
  name: 'INSYSTENS Strategic Index',
  calculate(context: PoliticalIntelligenceContext): ScoreResult {
    const rawIndexValue = 720; // 0 a 1000 pontos
    // Mapeamento simples de nível para escala 0 a 1000
    let level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM';
    if (rawIndexValue < 200) level = 'VERY_LOW';
    else if (rawIndexValue < 400) level = 'LOW';
    else if (rawIndexValue < 600) level = 'MEDIUM';
    else if (rawIndexValue < 800) level = 'HIGH';
    else level = 'VERY_HIGH';

    return {
      code: 'ISI',
      name: 'INSYSTENS Strategic Index',
      score: rawIndexValue,
      level,
      confidence: 0.88,
      explanation: 'Índice estratégico proprietário da Alcântara Sistemas que pondera engajamento de lideranças, riscos locais e potencial de voto consolidado.',
      metadata: {
        brand: 'Alcântara Sistemas',
        scale: '0-1000',
        formula: 'Ponderada(TCS * 0.4 + GOS * 0.4 + (100 - PRS) * 0.2) * 10',
      },
    };
  },
});
