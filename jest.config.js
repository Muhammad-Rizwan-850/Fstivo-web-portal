const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', '<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
    '^@/components/(.*)': '<rootDir>/src/components/$1',
    '^@/lib/(.*)': '<rootDir>/src/lib/$1',
    '^@/app/(.*)': '<rootDir>/src/app/$1',
    '^@/types/(.*)': '<rootDir>/src/types/$1',
    '^@supabase/supabase-js': '<rootDir>/src/__mocks__/@supabase/supabase-js.ts',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/.next/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 10,
      lines: 10,
      statements: 10,
    },
    // Higher thresholds on NEW code only (server-actions and API routes)
    './src/lib/actions/**/*.ts': {
      branches: 20,
      functions: 30,
      lines: 30,
      statements: 30,
    },
    './src/app/api/**/route.ts': {
      branches: 15,
      functions: 25,
      lines: 25,
      statements: 25,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
