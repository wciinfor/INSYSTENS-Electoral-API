export const ActionExecutionStatus = {
  PENDING: 'PENDING' as const,
  DISPATCHED: 'DISPATCHED' as const,
  EXECUTED: 'EXECUTED' as const,
  FAILED: 'FAILED' as const,
};

export type ActionExecutionStatus =
  typeof ActionExecutionStatus[keyof typeof ActionExecutionStatus];

export const ActionExecutionMode = {
  SIMULATED: 'SIMULATED' as const,
  MANUAL: 'MANUAL' as const,
};

export type ActionExecutionMode =
  typeof ActionExecutionMode[keyof typeof ActionExecutionMode];

export interface ActionExecutionRecord {
  tenantId: string;
  id: string; // exec-{proposalId}-att{attemptNumber}
  proposalId: string;
  decisionId: string;
  attemptNumber: number;
  status: ActionExecutionStatus;
  mode: ActionExecutionMode;
  executedBy: {
    actorId: string;
    actorType: string;
    tenantId: string;
  };
  result?: Record<string, unknown> | null;
  error?: string | null;
  dispatchedAt?: Date | string | null;
  completedAt?: Date | string | null;
  metadata: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}
