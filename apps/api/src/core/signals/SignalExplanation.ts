export interface SignalExplanation {
  title: string;
  summary: string;
  details: string;
  factors: string[];
  confidence: number; // 0.0 a 1.0
}
