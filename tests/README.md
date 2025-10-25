# Testing Guidelines

This project uses Vitest for unit and integration testing, and Playwright for end-to-end testing.

## Directory Structure

- `tests/unit` - Unit tests for individual components, utilities, and services
- `tests/e2e` - End-to-end tests using Playwright
- `tests/setup` - Setup files for test environment configuration
- `tests/mocks` - Mock data, handlers, and services for testing

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Open visual UI for tests
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### CI Tests

```bash
# Run all tests for CI
npm run test:ci
```

## Writing Tests

### Unit Tests

- Follow the unit testing guidelines in the `.cursor/rules/vitest-unit-testing.mdc` file
- Use Jest-like API with Vitest
- Use React Testing Library for component testing
- Group related tests with `describe` blocks
- Follow AAA (Arrange-Act-Assert) pattern
- Use MSW for API mocking

### E2E Tests

- Follow the E2E testing guidelines in the `.cursor/rules/playwright-e2e-testing.mdc` file
- Implement Page Object Model pattern for test maintainability
- Use locators for resilient element selection
- Use `expect` assertions with specific matchers
- Implement visual testing with screenshots when appropriate
- Use setup hooks for common operations like authentication

## Test Coverage

- Unit tests should cover utility functions, hooks, and components
- E2E tests should cover critical user flows and features
- Focus on meaningful tests rather than arbitrary coverage percentages
- Use coverage reports to identify untested code

## Mocking

- Use MSW for API mocking
- Use `vi.mock()` for mocking modules
- Use `vi.fn()` and `vi.spyOn()` for mocking functions
