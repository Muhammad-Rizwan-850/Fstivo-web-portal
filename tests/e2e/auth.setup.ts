import { test as setup } from '@playwright/test';

setup('create test users', async ({ request }) => {
  await request.post('/api/auth/register', {
    data: {
      email: 'organizer@test.com',
      password: 'Test123!@#',
      full_name: 'Test Organizer',
      role: 'organizer',
    },
    failOnStatusCode: false,
  });

  await request.post('/api/auth/register', {
    data: {
      email: 'attendee@test.com',
      password: 'Test123!@#',
      full_name: 'Test Attendee',
      role: 'attendee',
    },
    failOnStatusCode: false,
  });
});
