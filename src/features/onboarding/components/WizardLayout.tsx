import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { OnboardingStep } from '../types';

interface WizardLayoutProps {
  currentStep: OnboardingStep;
  steps: OnboardingStep[];
  stepLabels: Record<OnboardingStep, string>;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  isSubmitting?: boolean;
  canGoBack?: boolean;
  canGoNext?: boolean;
}

const STEP_ORDER: OnboardingStep[] = ['company', 'branch', 'warehouse', 'cashRegister', 'user', 'complete'];

export function WizardLayout({
  currentStep,
  steps,
  stepLabels,
  onNext,
  onBack,
  onSubmit,
  children,
  isSubmitting = false,
  canGoBack = true,
  canGoNext = true,
}: WizardLayoutProps) {
  const navigate = useNavigate();
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configuración inicial</h1>
          <p className="text-gray-500 mt-2">Completa los siguientes pasos para comenzar</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Paso {currentIndex + 1} de {steps.length}</span>
            <span>{stepLabels[currentStep]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>

        {/* Card with step content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{stepLabels[currentStep]}</CardTitle>
            <CardDescription>{getStepDescription(currentStep)}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack || currentIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Atrás
            </Button>

            {currentStep === 'complete' ? (
              <Button onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Guardando...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Completar
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={onNext} disabled={!canGoNext || isSubmitting}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function getStepDescription(step: OnboardingStep): string {
  switch (step) {
    case 'company':
      return 'Datos de tu empresa';
    case 'branch':
      return 'Información de tu sucursal principal';
    case 'warehouse':
      return 'Configura tu almacén principal';
    case 'cashRegister':
      return 'Define tu caja inicial';
    case 'user':
      return 'Crea tu cuenta de administrador';
    case 'complete':
      return '¡Todo listo!';
    default:
      return '';
  }
}