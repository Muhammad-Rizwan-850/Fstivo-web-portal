import { EventDashboard } from '@/components/features/event-dashboard'

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EventDashboard eventId={id} />
}
