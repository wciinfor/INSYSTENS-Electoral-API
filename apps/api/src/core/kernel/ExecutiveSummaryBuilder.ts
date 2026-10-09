import { PoliticalIntelligenceContext, ScoreResult, ExecutiveSummary } from './types';

export class ExecutiveSummaryBuilder {
  static build(context: PoliticalIntelligenceContext, scores: ScoreResult[]): ExecutiveSummary {
    const candidateName = context.candidateContext.candidateName || 'o Candidato';
    const role = context.candidateContext.role || 'Representante';
    const party = context.candidateContext.party || 'Partido';
    const uf = context.geographicContext.uf || 'SP';

    // Localizar scores para contextualizar o texto
    const isi = scores.find(s => s.code === 'ISI')?.score || 0;
    const tcs = scores.find(s => s.code === 'TCS')?.score || 0;
    const gos = scores.find(s => s.code === 'GOS')?.score || 0;

    const headline = `Desempenho Político Robusto: Índice ISI avaliado em ${isi} pontos para ${candidateName}.`;
    
    const paragraphs = [
      `A análise do INSYSTENS Strategic Kernel (SIK) para o gabinete de ${candidateName} (${role} pelo ${party}) aponta para uma presença territorial estabelecida no estado de ${uf}, sustentada por um Territory Confidence Score (TCS) de ${tcs}%. Esta solidez reflete uma base organizada de lideranças e eleitores cadastrados.`,
      `Em paralelo, identificamos um forte potencial de crescimento eleitoral nas regiões limítrofes, indicado pelo Growth Opportunity Score (GOS) de ${gos}%. A priorização e direcionamento de recursos para essas zonas de oportunidade podem acelerar significativamente a conversão de votos e ampliar a capilaridade política da conta.`
    ];

    const conclusion = 'Recomenda-se focar na ativação rápida de lideranças locais nas zonas de oportunidade identificadas e mitigar possíveis sobreposições de oposição.';

    return {
      headline,
      paragraphs,
      conclusion,
    };
  }
}
