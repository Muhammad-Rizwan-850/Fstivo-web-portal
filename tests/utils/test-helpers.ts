import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export function createMockRequest(
  url: string,
  options: Partial<Request> = {}
): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'GET',
    ...options,
  });
}

export function createMockUser(overrides = {}) {
  return {
    id: nanoid(),
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'attendee',
    ...overrides,
  };
}

export async function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
