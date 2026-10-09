export type RepositoryEntityType =
  | 'generic'
  | 'candidate'
  | 'party'
  | 'municipality'
  | 'election'
  | 'vote';

export interface RepositoryRecord {
  id: string;
  entity: RepositoryEntityType;
  source: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: string;
}
