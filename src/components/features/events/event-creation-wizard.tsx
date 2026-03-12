// Event Creation Wizard Component
import { useState } from 'react';
import { EventCreationStep } from './event-creation-step';

export interface EventCreationWizardProps {
  steps: Array<{
    title: string;
    description: string;
    component: React.ReactNode;
  }>;
  onComplete?: (data: Record<string, unknown>) => void;
}

export function EventCreationWizard({ steps, onComplete }: EventCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-1 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <EventCreationStep
        step={currentStep + 1}
        title={steps[currentStep].title}
        description={steps[currentStep].description}
        onNext={handleNext}
        onPrevious={currentStep > 0 ? handlePrevious : undefined}
        isLastStep={currentStep === steps.length - 1}
      >
        {steps[currentStep].component}
      </EventCreationStep>
    </div>
  );
}
