# Testing Guide for 10x Project

This document provides an overview of the testing setup and how to run tests for the 10x project.

## Testing Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **UI for Test Runner**: Vitest UI
- **Mocking**: Vitest + MSW (Mock Service Worker)

## Running Tests

### Running All Tests

To run all tests in the project:

```bash
npm test
```

### Running Tests in Watch Mode

For active development, you can run tests in watch mode, which will automatically re-run tests when files change:

```bash
npm run test:watch
```

### Running Tests with UI

For a visual interface to run and debug tests:

```bash
npm run test:ui
```

### Running Specific Tests

To run a specific test file or a group of test files:

```bash
# Run a specific test file
npx vitest run tests/unit/utils/debounce.test.ts

# Run all tests in a directory
npx vitest run tests/unit/utils/

# Run tests matching a pattern
npx vitest run --testNamePattern="should handle"
```

### Running Tests with Coverage

To generate a coverage report:

```bash
npm run test:coverage
```

## Test Structure

Tests are organized into the following directories:

- `tests/unit/` - Unit tests for individual components, hooks, and utilities
  - `components/` - Tests for React components
  - `hooks/` - Tests for custom hooks
  - `utils/` - Tests for utility functions
- `tests/e2e/` - End-to-end tests with Playwright
- `tests/setup/` - Test setup files
- `tests/mocks/` - Mock data and handlers

## Writing Tests

### Unit Tests

Unit tests should focus on testing a single unit of functionality in isolation. For components, this means testing their rendering and behavior without relying on the implementation of their dependencies.

Example component test:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../../../src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

Custom hooks should be tested using the `renderHook` utility from React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../../../src/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return the initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });
  
  it('should update state when action is called', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await act(async () => {
      result.current.increment();
    });
    
    expect(result.current.value).toBe(1);
  });
});
```

## Mocking

### Mocking API Calls

API calls should be mocked using the `vi.mock` function:

```typescript
import { vi } from 'vitest';
import { apiFunction } from '../../../src/api';

// Mock the API module
vi.mock('../../../src/api', () => ({
  apiFunction: vi.fn().mockResolvedValue({ data: 'mocked response' })
}));

describe('Component using API', () => {
  it('should handle API response', async () => {
    // Test component that uses apiFunction
    // Assert that apiFunction was called and response handled
  });
});
```

### Mocking Environment Variables

For environment variables used in tests, create a setup file that sets them before the tests run:

```typescript
// tests/setup/env.setup.ts
vi.stubEnv('MY_ENV_VAR', 'test-value');

// In your tests
describe('Component using env vars', () => {
  it('should use the mocked environment variable', () => {
    expect(process.env.MY_ENV_VAR).toBe('test-value');
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on testing the behavior of components rather than implementation details.
2. **Use Screen Queries Appropriately**: Prefer queries like `getByRole`, `getByText`, etc. over `getByTestId`.
3. **Mock Dependencies**: Mock external dependencies like API calls, localStorage, etc.
4. **Test Edge Cases**: Include tests for edge cases and error states.
5. **Keep Tests Independent**: Each test should be independent of others and not rely on shared state.
6. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.
