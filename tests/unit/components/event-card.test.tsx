import { render, screen } from '@testing-library/react';
import { EventCard } from '@/components/features/events/event-card';

describe('EventCard Component', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description',
    start_date: '2026-02-01',
    location: 'Test Venue',
    image_url: '/test.jpg',
    price: 1000,
  };

  it('should render event details', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should display price correctly', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Rs 1,000\.00/i)).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onClick = jest.fn();
    render(<EventCard event={mockEvent} onClick={onClick} />);
  });
});
