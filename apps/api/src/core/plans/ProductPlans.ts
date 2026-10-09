import * as Flags from '../featureFlags/FeatureFlags';

export interface ProductPlan {
  id: string;
  name: string;
  description: string;
  enabledFeatures: string[];
  metadata: Record<string, any>;
}

export const PLAN_STARTER: ProductPlan = {
  id: 'STARTER',
  name: 'Starter Plan',
  description: 'Plano inicial para candidatos municipais e pequenos comitês.',
  enabledFeatures: [
    Flags.FEATURE_POLITICAL_KERNEL,
    Flags.FEATURE_EXECUTIVE_REPORTS,
  ],
  metadata: {
    maxVoters: 5000,
    maxLeaders: 5,
  },
};

export const PLAN_PRO: ProductPlan = {
  id: 'PRO',
  name: 'Pro Plan',
  description: 'Plano profissional para parlamentares, prefeitos e campanhas consolidadas.',
  enabledFeatures: [
    Flags.FEATURE_POLITICAL_KERNEL,
    Flags.FEATURE_EXECUTIVE_REPORTS,
    Flags.FEATURE_STRATEGIC_ALERTS,
    Flags.FEATURE_HEATMAPS,
    Flags.FEATURE_EXPORT_PDF,
    Flags.FEATURE_API_ACCESS,
  ],
  metadata: {
    maxVoters: 50000,
    maxLeaders: 50,
  },
};

export const PLAN_PREMIUM: ProductPlan = {
  id: 'PREMIUM',
  name: 'Premium Plan',
  description: 'Plano completo de inteligência com recursos de IA e predição.',
  enabledFeatures: [
    Flags.FEATURE_POLITICAL_KERNEL,
    Flags.FEATURE_EXECUTIVE_REPORTS,
    Flags.FEATURE_STRATEGIC_ALERTS,
    Flags.FEATURE_HEATMAPS,
    Flags.FEATURE_EXPORT_PDF,
    Flags.FEATURE_API_ACCESS,
    Flags.FEATURE_AI_REPORTS,
    Flags.FEATURE_CAMPAIGN_SIMULATOR,
    Flags.FEATURE_PREDICTIVE_ANALYTICS,
    Flags.FEATURE_ADVANCED_RECOMMENDATIONS,
  ],
  metadata: {
    maxVoters: 250000,
    maxLeaders: 200,
  },
};

export const PLAN_PARTY: ProductPlan = {
  id: 'PARTY',
  name: 'Party Plan',
  description: 'Plano customizado para diretórios partidários estaduais ou nacionais.',
  enabledFeatures: [
    Flags.FEATURE_POLITICAL_KERNEL,
    Flags.FEATURE_EXECUTIVE_REPORTS,
    Flags.FEATURE_STRATEGIC_ALERTS,
    Flags.FEATURE_HEATMAPS,
    Flags.FEATURE_EXPORT_PDF,
    Flags.FEATURE_API_ACCESS,
    Flags.FEATURE_AI_REPORTS,
    Flags.FEATURE_CAMPAIGN_SIMULATOR,
    Flags.FEATURE_PREDICTIVE_ANALYTICS,
    Flags.FEATURE_ADVANCED_RECOMMENDATIONS,
    Flags.FEATURE_PARTY_ANALYTICS,
    Flags.FEATURE_TSE_IMPORT,
  ],
  metadata: {
    maxVoters: 1000000,
    maxLeaders: 1000,
  },
};

export const PLAN_CONSULTANCY: ProductPlan = {
  id: 'CONSULTANCY',
  name: 'Consultancy Plan',
  description: 'Plano para agências de marketing e consultorias políticas multicontas.',
  enabledFeatures: [
    Flags.FEATURE_POLITICAL_KERNEL,
    Flags.FEATURE_EXECUTIVE_REPORTS,
    Flags.FEATURE_STRATEGIC_ALERTS,
    Flags.FEATURE_HEATMAPS,
    Flags.FEATURE_EXPORT_PDF,
    Flags.FEATURE_API_ACCESS,
    Flags.FEATURE_AI_REPORTS,
    Flags.FEATURE_CAMPAIGN_SIMULATOR,
    Flags.FEATURE_PREDICTIVE_ANALYTICS,
    Flags.FEATURE_ADVANCED_RECOMMENDATIONS,
    Flags.FEATURE_CONSULTANCY_MODE,
    Flags.FEATURE_EXPORT_POWERBI,
    Flags.FEATURE_TSE_IMPORT,
  ],
  metadata: {
    maxVoters: 2000000,
    maxLeaders: 2000,
  },
};

export const PLAN_ENTERPRISE: ProductPlan = {
  id: 'ENTERPRISE',
  name: 'Enterprise Plan',
  description: 'Acesso total e irrestrito à plataforma com limites customizados.',
  enabledFeatures: Object.values(Flags),
  metadata: {
    maxVoters: -1, // Ilimitado
    maxLeaders: -1, // Ilimitado
  },
};

export const PRODUCT_PLANS: Record<string, ProductPlan> = {
  STARTER: PLAN_STARTER,
  PRO: PLAN_PRO,
  PREMIUM: PLAN_PREMIUM,
  PARTY: PLAN_PARTY,
  CONSULTANCY: PLAN_CONSULTANCY,
  ENTERPRISE: PLAN_ENTERPRISE,
};

export function getPlanById(id: string): ProductPlan {
  return PRODUCT_PLANS[id.toUpperCase()] || PLAN_STARTER;
}
