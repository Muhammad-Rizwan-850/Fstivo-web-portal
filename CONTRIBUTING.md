# Contributing to FSTIVO

Thank you for your interest in contributing to FSTIVO! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, or pnpm
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fstivo.git
   ```
3. Navigate to the project directory:
   ```bash
   cd fstivo
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
6. Set up environment variables (copy `.env.local.example` to `.env.local`)

## Development Workflow

1. **Branch Naming**
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Test additions or changes
   - `chore/` - Maintenance tasks

2. **Making Changes**
   - Write clear, concise code
   - Follow coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Testing**
   ```bash
   # Run tests
   npm test

   # Run with coverage
   npm run test:coverage

   # Run specific test suites
   npm run test:unit
   npm run test:integration
   ```

4. **Linting and Formatting**
   ```bash
   # Run linter
   npm run lint

   # Fix linting issues
   npm run lint:fix

   # Format code
   npm run format
   ```

5. **Type Checking**
   ```bash
   npm run typecheck
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types
- Use interfaces for object shapes
- Provide meaningful type names
- Use JSDoc comments for complex functions

### React/Next.js

- Use functional components with hooks
- Prefer composition over inheritance
- Use the `app` directory structure
- Implement proper error boundaries
- Use Server Components by default, Client Components when needed

### Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Ensure accessibility (ARIA labels, keyboard navigation)
- Use semantic HTML elements

### File Organization

- Group related files in feature folders
- Use index files for cleaner imports
- Keep component files focused and small
- Separate business logic from UI components

### Naming Conventions

- **Files**: kebab-case (`event-card.tsx`)
- **Components**: PascalCase (`EventCard`)
- **Functions/Variables**: camelCase (`fetchEvents`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`EventType`)

## Testing Guidelines

### Unit Tests

- Test pure functions in isolation
- Mock external dependencies
- Aim for high code coverage
- Test edge cases and error conditions

### Integration Tests

- Test component interactions
- Test API endpoints
- Use test database/fixtures

### E2E Tests

- Test critical user flows
- Test across multiple browsers
- Keep tests maintainable

### Test Structure

```typescript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup
  })

  it('should do something specific', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

## Commit Messages

Follow the commit message guide in [COMMIT_MESSAGE_GUIDE.md](./COMMIT_MESSAGE_GUIDE.md).

## Pull Request Process

### Before Submitting

1. Ensure your code passes all tests
2. Update documentation if needed
3. Add tests for new functionality
4. Run linting and fix issues
5. Update the CHANGELOG if applicable

### Submitting a PR

1. Push your branch to your fork
2. Create a pull request to the main repository
3. Fill out the PR template completely
4. Link related issues
5. Request reviews from maintainers

### PR Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review feedback
4. Keep the PR focused and small
5. Squash commits if needed

### After Merge

- Delete your branch
- Update your local main branch
- Celebrate! 🎉

## Questions or Issues?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing documentation first

## Recognition

Contributors will be acknowledged in the project's contributors section.

Thank you for contributing to FSTIVO! 🚀
