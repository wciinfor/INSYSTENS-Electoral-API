import { ElectoralContext } from '../context/ContextProvider';

export type PoliticalIntelligenceContext = ElectoralContext;

export interface ScoreResult {
  code: string; // Ex: TCS, GOS, PRS, ISI
  name: string;
  score: number;
  level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  confidence: number; // 0.0 a 1.0
  explanation: string;
  metadata?: Record<string, any>;
}

export interface RecommendationResult {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'TERRITORIAL' | 'COMMUNICATION' | 'ORGANIZATION' | 'DIGITAL';
}

export interface AlertResult {
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface AIContextPayload {
  candidateRole: string | null;
  state: string | null;
  priorityZonalIndicators: Array<{ zone: string; priority: string }>;
  strengthAreas: string[];
  weaknessAreas: string[];
  voterEngagementProfile: {
    totalRegisteredVoters: number;
    activityLevel: string;
  };
}

export interface ExecutiveSummary {
  headline: string;
  paragraphs: string[];
  conclusion: string;
}

export const KERNEL_VERSION = "1.0.0";
export const REPOSITORY_VERSION = "1.0.0";

export interface KernelAnalysisResult {
  scores: ScoreResult[];
  opportunities: any[];
  recommendations: RecommendationResult[];
  alerts: AlertResult[];
  executiveSummary: ExecutiveSummary;
  aiContext: AIContextPayload;
  metadata: {
    kernelVersion: string;
    repositoryVersion: string;
    generatedAt: string;
    accountId: string;
    dataMode: string;
  };
}

export interface ScoreEngine {
  code: string;
  name: string;
  calculate(context: PoliticalIntelligenceContext): ScoreResult;
}
