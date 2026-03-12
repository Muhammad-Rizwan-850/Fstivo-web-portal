import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventCreationStep } from '@/components/features/events/event-creation-step';

const VALID_STEPS = ['basics', 'details', 'tickets', 'venue', 'review'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}): Promise<Metadata> {
  const { step } = await params;
  return {
    title: `Create Event - Step ${step} | FSTIVO`,
  };
}

export default async function EventCreationStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!VALID_STEPS.includes(step)) {
    notFound();
  }

  const stepIndex = VALID_STEPS.indexOf(step) + 1; // Convert to 1-based index
  const stepTitles = {
    basics: 'Basic Information',
    details: 'Event Details',
    tickets: 'Ticket Setup',
    venue: 'Venue & Location',
    review: 'Review & Publish'
  };
  const stepDescriptions = {
    basics: 'Tell us about your event basics',
    details: 'Add more details about your event',
    tickets: 'Set up ticket types and pricing',
    venue: 'Choose the venue and location',
    review: 'Review and publish your event'
  };

  return (
    <EventCreationStep
      step={stepIndex}
      title={stepTitles[step as keyof typeof stepTitles]}
      description={stepDescriptions[step as keyof typeof stepDescriptions]}
    >
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Step {stepIndex}: {stepTitles[step as keyof typeof stepTitles]}</h2>
        <p className="text-muted-foreground mb-8">{stepDescriptions[step as keyof typeof stepDescriptions]}</p>
        <p className="text-sm text-muted-foreground">This step is under development. Please use the main event creation wizard.</p>
      </div>
    </EventCreationStep>
  );
}
