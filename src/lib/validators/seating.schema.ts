import { z } from 'zod';

export const venueSchema = z.object({
  name: z.string().min(3, 'Venue name is required'),
  address: z.string().min(10, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  layout: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

export const seatingChartSchema = z.object({
  event_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  name: z.string().min(3, 'Chart name is required'),
});

export const sectionSchema = z.object({
  chart_id: z.string().uuid(),
  name: z.string().min(1, 'Section name is required'),
  capacity: z.number().int().positive(),
  price: z.number().min(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

export const seatSchema = z.object({
  section_id: z.string().uuid(),
  row: z.string().min(1),
  number: z.string().min(1),
  is_accessible: z.boolean().default(false),
});

export type VenueInput = z.infer<typeof venueSchema>;
export type SeatingChartInput = z.infer<typeof seatingChartSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SeatInput = z.infer<typeof seatSchema>;
