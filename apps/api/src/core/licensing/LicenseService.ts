import { ProductPlan, getPlanById } from '../plans/ProductPlans';
import { Capability } from './Capability';
import * as Flags from '../featureFlags/FeatureFlags';

export interface AccountLicense {
  plan: ProductPlan;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  validUntil: string;
  enabledFeatures: string[];
  capabilities: Capability;
  restrictions: {
    maxVoters: number;
    maxLeaders: number;
  };
}

export class LicenseService {
  /**
   * Resolve a licença de uma conta de forma determinística/mockada nesta etapa
   */
  static resolveLicense(account: any): AccountLicense {
    // Dedução de plano baseada no tipo da conta política
    let planId = 'STARTER';
    if (account.type === 'PARLAMENTAR') {
      planId = 'PREMIUM';
    } else if (account.type === 'PARTIDO') {
      planId = 'PARTY';
    } else if (account.type === 'CONSULTORIA') {
      planId = 'CONSULTANCY';
    }

    const plan = getPlanById(planId);
    const enabledFeatures = plan.enabledFeatures;

    // Mapeamento de Feature Flags em Capabilities de negócio
    const capabilities: Capability = {
      canGenerateAIReports: enabledFeatures.includes(Flags.FEATURE_AI_REPORTS),
      canUseHeatmaps: enabledFeatures.includes(Flags.FEATURE_HEATMAPS),
      canUseSimulator: enabledFeatures.includes(Flags.FEATURE_CAMPAIGN_SIMULATOR),
      canExportPDF: enabledFeatures.includes(Flags.FEATURE_EXPORT_PDF),
      canExportPowerBI: enabledFeatures.includes(Flags.FEATURE_EXPORT_POWERBI),
      canAccessAPI: enabledFeatures.includes(Flags.FEATURE_API_ACCESS),
      canUsePredictiveAnalytics: enabledFeatures.includes(Flags.FEATURE_PREDICTIVE_ANALYTICS),
    };

    return {
      plan,
      status: 'ACTIVE',
      validUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(), // Válido até fim do próximo ano
      enabledFeatures,
      capabilities,
      restrictions: {
        maxVoters: plan.metadata.maxVoters || 5000,
        maxLeaders: plan.metadata.maxLeaders || 5,
      },
    };
  }
}
