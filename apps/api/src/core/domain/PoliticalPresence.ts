export interface PoliticalPresence {
  presenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEPTIONAL';
  engagementLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEPTIONAL';
  leadershipDensity: number; // ex: líderes por 10.000 eleitores
  eventParticipation: number; // quantidade de eventos no período
  socialActions: number; // quantidade de ações sociais registradas
  territorialCoverage: number; // ex: percentual de zonas ou bairros com presença
}
