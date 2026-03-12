import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

export default function () {
  // Test homepage
  const homeRes = http.get('https://fstivo.com');
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test event listing
  const eventsRes = http.get('https://fstivo.com/api/events');
  check(eventsRes, {
    'events API status is 200': (r) => r.status === 200,
    'events API responds in < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
