// Event Creation Step Component
export interface EventCreationStepProps {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  isLastStep?: boolean;
}

export function EventCreationStep({
  step,
  title,
  description,
  children,
  onNext,
  onPrevious,
  isLastStep,
}: EventCreationStepProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <span className="text-sm text-gray-500">Step {step}</span>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="mb-6">{children}</div>
      <div className="flex justify-between">
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Previous
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
          >
            {isLastStep ? 'Create Event' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
