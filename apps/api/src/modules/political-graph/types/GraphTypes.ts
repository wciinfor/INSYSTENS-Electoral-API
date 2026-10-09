export enum PoliticalNodeType {
  POLITICIAN = 'POLITICIAN',
  PARTY = 'PARTY',
  CITY = 'CITY',
  ELECTORAL_ZONE = 'ELECTORAL_ZONE',
  SECTION = 'SECTION',
  LEADER = 'LEADER',
  SOCIAL_ACTION = 'SOCIAL_ACTION',
  DEMAND = 'DEMAND',
  EVENT = 'EVENT',
  VOTER = 'VOTER',
  CAMPAIGN = 'CAMPAIGN',
}

export enum PoliticalEdgeType {
  BELONGS_TO = 'BELONGS_TO',
  PARTICIPATED_IN = 'PARTICIPATED_IN',
  INFLUENCES = 'INFLUENCES',
  REPRESENTS = 'REPRESENTS',
  HAS_DEMAND = 'HAS_DEMAND',
  ATTENDED = 'ATTENDED',
  CONNECTED_TO = 'CONNECTED_TO',
  LOCATED_IN = 'LOCATED_IN',
  SUPPORTED_BY = 'SUPPORTED_BY',
  IMPACTED_BY = 'IMPACTED_BY',
}

export interface IPoliticalNode {
  id: string;
  type: PoliticalNodeType;
  label: string;
  metadata: Record<string, any>;
  score?: number;
  createdAt?: string;
}

export interface IPoliticalEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: PoliticalEdgeType;
  weight?: number;
  confidence?: number;
  metadata: Record<string, any>;
}

export interface IPoliticalGraph {
  id: string;
  accountId: string;
  nodes: IPoliticalNode[];
  edges: IPoliticalEdge[];
  metadata: Record<string, any>;
  generatedAt: string;
}
