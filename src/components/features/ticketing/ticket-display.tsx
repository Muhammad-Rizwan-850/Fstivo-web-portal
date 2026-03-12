import { Card } from '@/components/ui/card';
import Image from 'next/image';

interface Ticket {
  id: string;
  qr_code: string;
  event: {
    title: string;
    start_date: string;
    venue?: {
      name: string;
      address: string;
    };
  };
  tier: {
    name: string;
  };
  status: string;
}

interface TicketDisplayProps {
  ticket: Ticket;
}

export function TicketDisplay({ ticket }: TicketDisplayProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-xl">{ticket.event.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(ticket.event.start_date).toLocaleDateString('en-PK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {ticket.event.venue && (
                <p className="text-sm text-muted-foreground mt-1">
                  {ticket.event.venue.name}
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              ticket.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : ticket.status === 'checked_in'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">Ticket Type</p>
            <p className="font-semibold">{ticket.tier.name}</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            {ticket.qr_code ? (
              <Image
                src={ticket.qr_code}
                alt="QR Code"
                width={100}
                height={100}
                className="w-24 h-24"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">QR</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Scan at entrance</p>
        </div>
      </div>
    </Card>
  );
}
