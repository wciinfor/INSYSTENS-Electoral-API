import { PoliticalIntelligenceContext, ScoreResult, AIContextPayload } from './types';

export class AIContextBuilder {
  static build(context: PoliticalIntelligenceContext, scores: ScoreResult[]): AIContextPayload {
    const uf = context.geographicContext.uf || 'SP';

    // Determinar forças e fraquezas baseando-se nos scores mockados
    const tcs = scores.find(s => s.code === 'TCS')?.score || 0;
    const prs = scores.find(s => s.code === 'PRS')?.score || 0;

    const strengthAreas = tcs > 60 
      ? ['Forte capilaridade de líderes locais', 'Base territorial consolidada na capital']
      : ['Engajamento concentrado'];

    const weaknessAreas = prs > 30
      ? ['Ameaça de sobreposição de concorrência nas zonas periféricas', 'Taxa histórica de abstenção moderada na região']
      : ['Abstenção controlada'];

    return {
      candidateRole: context.candidateContext.role,
      state: uf,
      priorityZonalIndicators: [
        { zone: `Zona 123 - Centro, ${uf}`, priority: 'HIGH' },
        { zone: `Zona 342 - Vila Nova, ${uf}`, priority: 'MEDIUM' }
      ],
      strengthAreas,
      weaknessAreas,
      voterEngagementProfile: {
        totalRegisteredVoters: 3500,
        activityLevel: 'HIGH'
      }
    };
  }
}
