export const ActionProposalStatus = {
  PROPOSED: 'PROPOSED' as const,
  AUTHORIZED: 'AUTHORIZED' as const,
  REJECTED: 'REJECTED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export type ActionProposalStatus = typeof ActionProposalStatus[keyof typeof ActionProposalStatus];

export interface ActionProposalRecord {
  tenantId: string;
  id: string; // act-{decisionId}-{fingerprint}
  decisionId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  expectedImpact: string;
  estimatedGain: number;
  timeframe: string;
  status: ActionProposalStatus;
  metadata: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}
