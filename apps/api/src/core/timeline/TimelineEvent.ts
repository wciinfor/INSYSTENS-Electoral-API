import { TimelinePriority } from './TimelinePriority';
import { TimelineStatus } from './TimelineStatus';

export interface TimelineEvent {
  id: string;
  title: string;
  summary: string;
  priority: TimelinePriority;
  status: TimelineStatus;
  startDate: string; // ISO String
  endDate: string; // ISO String
  expectedImpact: string;
  relatedDecisionIds: string[]; // IDs das Decisions relacionadas
  metadata?: Record<string, any>;
}
