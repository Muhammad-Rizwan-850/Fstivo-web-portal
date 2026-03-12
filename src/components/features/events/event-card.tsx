import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  location: string;
  price?: number;
  category?: string;
}

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          {event.category && (
            <Badge variant="secondary">{event.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
        <div className="flex justify-between items-center text-sm">
          <span>{event.location}</span>
          <span>{new Date(event.start_date).toLocaleDateString()}</span>
        </div>
        {event.price && (
          <div className="mt-2 text-lg font-semibold">
            {formatCurrency(event.price)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}