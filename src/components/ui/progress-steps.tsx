'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  name: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const ProgressSteps = React.memo(function ProgressSteps({ steps, currentStep, onStepClick }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index < currentStep;

          return (
            <li key={step.id} className="relative flex-1">
              {index !== 0 && (
                <div
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5',
                    isComplete ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                  style={{ left: '-50%' }}
                />
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex flex-col items-center group',
                  isClickable && 'cursor-pointer hover:opacity-80'
                )}
              >
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isComplete && 'bg-blue-600 border-blue-600',
                    isCurrent && 'border-blue-600 bg-white',
                    !isComplete && !isCurrent && 'border-gray-300 bg-white'
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-blue-600' : 'text-gray-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-blue-600' : 'text-gray-900'
                    )}
                  >
                    {step.name}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
})
