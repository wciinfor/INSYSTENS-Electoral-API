# INSYSTENS Product Plans & Feature Flags Architecture

Este documento descreve a governança de licenciamento, planos comerciais, feature flags e capabilities do ecossistema da **INSYSTENS Electoral API**.

---

## 1. Objetivo da Arquitetura

O objetivo é estruturar uma camada comercial SaaS desacoplada. Isso garante que:
* Diferentes restrições de limites de eleitores, acessos analíticos e ferramentas adicionais possam ser ativadas/desativadas dinamicamente.
* O **Strategic Intelligence Kernel (SIK)** nunca acesse tabelas de planos diretamente. Ele apenas consulta o `FeatureFlagService` ou `LicenseService`.
* A alteração de regras comerciais e pacotes ocorra sem necessidade de reescrever lógica interna do Kernel de inteligência.

---

## 2. Fluxo de Resolução

```
Account (Gabinete / Partido / Consultoria)
   ↓
LicenseService (Mapeia o perfil em plano comercial ativo)
   ↓
FeatureFlagService (Resolve recursos ativados e capacidades estruturais)
   ↓
SIK Kernel (Consome as capabilities e as features permitidas)
```

---

## 3. Planos de Produto Disponíveis

1. **STARTER**: Para campanhas de vereadores municipais ou pequenos diretórios locais.
2. **PRO**: Para campanhas municipais consolidadas e gabinetes parlamentares estaduais.
3. **PREMIUM**: Campanhas estaduais competitivas que utilizam recursos de inteligência avançada e relatórios com IA.
4. **PARTY**: Focado em diretórios estaduais ou nacionais para monitoramento multicandidatos.
5. **CONSULTANCY**: Focado em agências de marketing e assessoria política.
6. **ENTERPRISE**: Customizado, com acesso completo e irrestrito.

---

## 4. Feature Flags e Capabilities Mapeadas

### Feature Flags Disponíveis
* `FEATURE_POLITICAL_KERNEL`
* `FEATURE_AI_REPORTS`
* `FEATURE_HEATMAPS`
* `FEATURE_CAMPAIGN_SIMULATOR`
* `FEATURE_PARTY_ANALYTICS`
* `FEATURE_CONSULTANCY_MODE`
* `FEATURE_EXPORT_PDF`
* `FEATURE_EXPORT_POWERBI`
* `FEATURE_PREDICTIVE_ANALYTICS`
* `FEATURE_TSE_IMPORT`
* `FEATURE_API_ACCESS`

### Capabilities Expostas
* `canGenerateAIReports`
* `canUseHeatmaps`
* `canUseSimulator`
* `canExportPDF`
* `canExportPowerBI`
* `canAccessAPI`
* `canUsePredictiveAnalytics`

---

## 5. Exemplo Prático de Utilização

### Verificação de Feature Flags
```typescript
import { FeatureFlagService } from '../featureFlags/FeatureFlagService';

const account = { id: 'uuid-123', type: 'PARLAMENTAR' };

if (FeatureFlagService.has(account, 'FEATURE_AI_REPORTS')) {
  // Executa rotina de geração de relatórios de IA
}
```

### Verificação de Capabilities
```typescript
const capabilities = FeatureFlagService.getCapabilities(account);

if (capabilities.canUseHeatmaps) {
  // Renderiza mapas de calor eleitorais
}
```

---

## 6. Roadmap Comercial Futuro

* **Integração Operacional**: Acoplamento com gateway de pagamento (Stripe/Asaas) para atualização de planos em tempo real.
* **Licenciamento Avançado**: Controle por tokens de consumo (ex: cota mensal de relatórios IA por conta).
* **Painel Administrativo**: Interface para o time de suporte ativar ou suspender contas e licenças manualmente.
