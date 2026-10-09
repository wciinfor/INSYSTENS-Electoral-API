import { EntityType } from './EntityType';

export interface ProviderManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  supportedEntities: EntityType[];
}
