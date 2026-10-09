import { GraphRelationType } from './GraphRelationType';

export interface RelationshipResult {
  matched: boolean;
  relation?: GraphRelationType;
  confidence?: number;
  weight?: number;
  metadata?: Record<string, any>;
}
