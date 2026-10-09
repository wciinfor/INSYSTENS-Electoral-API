import { LicenseService } from '../licensing/LicenseService';
import { Capability } from '../licensing/Capability';
import { ProductPlan } from '../plans/ProductPlans';

export class FeatureFlagService {
  /**
   * Verifica se o tenant/account ativo possui acesso a uma Feature Flag específica
   */
  static has(account: any, feature: string): boolean {
    const license = LicenseService.resolveLicense(account);
    return license.enabledFeatures.includes(feature);
  }

  /**
   * Obtém a lista completa de Feature Flags habilitadas para o tenant
   */
  static getEnabledFeatures(account: any): string[] {
    const license = LicenseService.resolveLicense(account);
    return license.enabledFeatures;
  }

  /**
   * Retorna os detalhes do plano contratado associado ao tenant
   */
  static getPlan(account: any): ProductPlan {
    const license = LicenseService.resolveLicense(account);
    return license.plan;
  }

  /**
   * Retorna a matriz de Capabilities mapeada a partir do plano e das licenças do tenant
   */
  static getCapabilities(account: any): Capability {
    const license = LicenseService.resolveLicense(account);
    return license.capabilities;
  }
}
