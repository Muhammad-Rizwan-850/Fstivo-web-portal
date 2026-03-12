'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Seat {
  id: string;
  number: string;
  status: 'available' | 'reserved' | 'sold';
}

interface Section {
  id: string;
  name: string;
  seats: Seat[];
}

interface Chart {
  id: string;
  name: string;
}

interface SeatingChartViewerProps {
  chart: Chart;
  sections: Section[];
}

export function SeatingChartViewer({ chart, sections }: SeatingChartViewerProps) {
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  const handleSeatClick = (seatId: string, seat: Seat) => {
    if (seat.status !== 'available') return;

    setSelectedSeats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seatId)) {
        newSet.delete(seatId);
      } else {
        newSet.add(seatId);
      }
      return newSet;
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">{chart.name}</h2>
      
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 text-center">
        <div className="inline-block px-8 py-2 bg-gray-200 dark:bg-gray-800 rounded font-bold text-lg">
          STAGE
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">{section.name}</h3>
            <div className="grid grid-cols-10 gap-1">
              {section.seats.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat.id, seat)}
                  disabled={seat.status !== 'available'}
                  className={`
                    aspect-square rounded text-xs font-medium transition-colors
                    ${
                      selectedSeats.has(seat.id)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : seat.status === 'available'
                        ? 'bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 hover:bg-green-300 dark:hover:bg-green-800'
                        : seat.status === 'reserved'
                        ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    }
                    ${seat.status !== 'available' ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={`Seat ${seat.number} - ${seat.status}`}
                >
                  {seat.number}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900 rounded" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <span>Sold</span>
        </div>
      </div>

      {selectedSeats.size > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-semibold">
            {selectedSeats.size} seat{selectedSeats.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </Card>
  );
}
