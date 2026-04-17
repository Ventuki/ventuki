import { WizardLayout } from '../components/WizardLayout';
import { CompanyStep } from '../components/steps/CompanyStep';
import { BranchStep } from '../components/steps/BranchStep';
import { WarehouseStep } from '../components/steps/WarehouseStep';
import { CashRegisterStep } from '../components/steps/CashRegisterStep';
import { UserStep } from '../components/steps/UserStep';
import { CompleteStep } from '../components/steps/CompleteStep';
import { useOnboarding } from '../hooks/useOnboarding';

export function OnboardingPage() {
  const {
    currentStep,
    steps,
    stepLabels,
    formData,
    isSubmitting,
    handleStepSubmit,
    handleBack,
    handleComplete,
  } = useOnboarding();

  const renderStep = () => {
    switch (currentStep) {
      case 'company':
        return (
          <CompanyStep
            defaultValues={formData.company}
            onSubmit={(data) => handleStepSubmit('company', data)}
          />
        );
      case 'branch':
        return (
          <BranchStep
            defaultValues={formData.branch}
            onSubmit={(data) => handleStepSubmit('branch', data)}
          />
        );
      case 'warehouse':
        return (
          <WarehouseStep
            defaultValues={formData.warehouse}
            onSubmit={(data) => handleStepSubmit('warehouse', data)}
          />
        );
      case 'cashRegister':
        return (
          <CashRegisterStep
            defaultValues={formData.cashRegister}
            onSubmit={(data) => handleStepSubmit('cashRegister', data)}
          />
        );
      case 'user':
        return (
          <UserStep
            defaultValues={formData.user}
            onSubmit={(data) => handleStepSubmit('user', data)}
          />
        );
      case 'complete':
        return <CompleteStep companyName={formData.company?.companyName || 'Tu empresa'} />;
      default:
        return null;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      steps={steps}
      stepLabels={stepLabels}
      onNext={() => {}} // handled by step components
      onBack={handleBack}
      onSubmit={handleComplete}
      isSubmitting={isSubmitting}
      canGoBack={currentStep !== 'company'}
      canGoNext={false} // each step handles its own submit
    >
      {renderStep()}
    </WizardLayout>
  );
}