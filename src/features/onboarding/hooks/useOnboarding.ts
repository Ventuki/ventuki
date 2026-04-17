import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OnboardingFormData, OnboardingStep } from '../types';

const STEPS: OnboardingStep[] = ['company', 'branch', 'warehouse', 'cashRegister', 'user', 'complete'];

const STEP_LABELS: Record<OnboardingStep, string> = {
  company: 'Empresa',
  branch: 'Sucursal',
  warehouse: 'Almacén',
  cashRegister: 'Caja',
  user: 'Usuario',
  complete: 'Completado',
};

export function useOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('company');
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleStepSubmit = (step: keyof OnboardingFormData, data: any) => {
    setFormData((prev) => ({ ...prev, [step]: data }));
    handleNext();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // TODO: Call API to submit all onboarding data
      console.log('Onboarding complete:', formData);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate('/dashboard');
    } catch (err) {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    steps: STEPS,
    stepLabels: STEP_LABELS,
    formData,
    isSubmitting,
    error,
    handleNext,
    handleBack,
    handleStepSubmit,
    handleComplete,
  };
}