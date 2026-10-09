import { ProviderManifest } from '../../domain/ProviderManifest';

export const TseProviderManifest: ProviderManifest = {
  id: 'tse',
  name: 'Tribunal Superior Eleitoral',
  version: '1.0.0',
  description: 'Provider oficial para importação de dados públicos do TSE',
  supportedEntities: ['candidate', 'party', 'municipality', 'election', 'vote'],
};
