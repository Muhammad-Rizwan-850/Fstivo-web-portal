import { TicketDisplay } from '@/components/features/ticket-display'

interface TicketPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params
  return <TicketDisplay registrationId={id} />
}

export const metadata = {
  title: 'My Ticket - Fstivo',
  description: 'View your event ticket and QR code',
}
