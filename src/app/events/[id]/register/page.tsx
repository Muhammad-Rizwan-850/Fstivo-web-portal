import { EventRegistration } from '@/components/features/event-registration'

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EventRegistration eventId={id} />
}
