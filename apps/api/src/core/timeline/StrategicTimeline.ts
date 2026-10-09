import { TimelineEvent } from './TimelineEvent';
import { TimelineRecommendation } from './TimelineRecommendation';

export interface StrategicTimeline {
  generatedAt: string; // ISO String
  events: TimelineEvent[];
  recommendations: TimelineRecommendation[];
}
