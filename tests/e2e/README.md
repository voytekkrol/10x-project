# E2E Tests for 10x-project

This directory contains end-to-end tests using Playwright for the flashcard application.

## Setup

### Prerequisites

1. **Build the application** before running tests:
   ```bash
   npm run build
   ```

2. **Test Database**: You need a test database with Supabase. You can either:
   - Use a separate Supabase project for testing
   - Use the same project but with test data

3. **Test User Credentials**: Create a test user in your Supabase database and configure credentials.

### Configuration

Create a `.env.test` file in the project root with test credentials:

```env
# Supabase Configuration (can be same as development or separate test project)
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Test User Credentials
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPassword123!

# OpenRouter API (for AI generation tests)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Creating a Test User

You need to create a test user in Supabase:

#### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter test credentials (email and password)
5. Verify the email or disable email confirmation for test environment

#### Option 2: Via SQL
```sql
-- Insert test user (adjust as needed)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'testuser@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  now()
);
```

### Update Test Setup

Update `tests/setup/playwright.setup.ts` to use environment variables:

```typescript
export async function login(
  page: Page, 
  email = process.env.TEST_USER_EMAIL || "test@example.com", 
  password = process.env.TEST_USER_PASSWORD || "password"
) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/**/generate", { timeout: 10000 });
}
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npm run test:e2e generate.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run specific test by name
```bash
npx playwright test -g "should generate flashcards"
```

## Test Structure

### Page Object Models (POM)

All page interactions are encapsulated in Page Object Model classes located in `tests/e2e/pages/`:

- **LoginPage**: Authentication page interactions
- **GeneratePage**: Flashcard generation page interactions
- **ProposalCard**: Individual proposal card interactions

Example usage:
```typescript
const generatePage = new GeneratePage(page);
await generatePage.goto();
await generatePage.generateFlashcards("Your source text...");
await generatePage.expectProposalsGenerated();
```

### Test Files

- `auth.spec.ts` - Authentication flow tests
- `generate.spec.ts` - Flashcard generation workflow tests

## Test Scenarios Covered

### Generate Page Tests
1. ✅ Page load and form visibility
2. ✅ Source text validation
3. ✅ Flashcard generation from source text
4. ✅ Proposal acceptance/rejection/editing
5. ✅ Saving accepted and edited flashcards
6. ✅ Handling edited flashcards (AI-Edited source)
7. ✅ Start fresh functionality
8. ✅ Generation status display
9. ✅ Button state management during generation
10. ✅ Accessibility standards
11. ✅ Visual regression testing

### Auth Tests
1. ✅ Form validation
2. ✅ Email format validation
3. ✅ Navigation to forgot password
4. ✅ Successful login flow
5. ✅ Accessibility standards

## Debugging Failed Tests

### View test report
```bash
npx playwright show-report
```

### View traces
Traces are automatically captured on first retry. View them in the HTML report.

### Screenshots and Videos
- Screenshots are taken on failure
- Videos are recorded on first retry
- Both are available in `test-results/` directory

### Common Issues

#### 1. Login Timeout
**Error**: `page.waitForURL: Test timeout of 30000ms exceeded`

**Solutions**:
- Verify test credentials are correct
- Check if test user exists in database
- Ensure Supabase is accessible
- Check if email verification is required

#### 2. Build Not Found
**Error**: `The server entrypoint does not exist`

**Solution**: Run `npm run build` before tests

#### 3. Port Already in Use
**Error**: `Port 3000 is already in use`

**Solution**: Stop any running dev server or change port in `playwright.config.ts`

#### 4. AI Generation Failures
Tests requiring actual AI generation need:
- Valid OPENROUTER_API_KEY
- Sufficient API credits
- Consider mocking AI responses for faster, more reliable tests

## Mocking (Future Enhancement)

For faster and more reliable tests, consider mocking:

1. **Auth Responses**: Mock Supabase auth
2. **AI Generation**: Mock OpenRouter API responses
3. **Database**: Use in-memory database or fixtures

Example mock setup:
```typescript
await page.route('**/api/generations', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({
      // mock response data
    })
  });
});
```

## CI/CD Integration

Tests are configured for CI environments with:
- Retry on failure (2 retries in CI)
- Single worker in CI for stability
- HTML report generation
- Screenshot and video capture

### GitHub Actions Example
```yaml
- name: Run E2E tests
  run: |
    npm run build
    npm run test:e2e
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
    PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}
```

## Best Practices

1. **Keep tests independent**: Each test should set up its own state
2. **Use Page Object Models**: Keep selectors and actions in POM classes
3. **Use data-test-id**: Prefer test IDs over other selectors for stability
4. **Clean up after tests**: Reset state or use isolated test users
5. **Mock when appropriate**: Mock slow/expensive operations (AI, external APIs)
6. **Meaningful assertions**: Test behavior, not implementation
7. **Avoid hardcoded waits**: Use Playwright's auto-waiting features

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Generator](https://playwright.dev/docs/codegen) - Use `npx playwright codegen` to generate tests



