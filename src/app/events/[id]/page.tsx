import { EventDetails } from '@/components/features/event-details'

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EventDetails />
}
