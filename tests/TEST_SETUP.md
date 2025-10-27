# E2E Test Setup Guide

## Quick Start

### 1. Build the Application
```bash
npm run build
```

### 2. Create Test User in Supabase

#### Via Supabase Dashboard:
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** or **"Invite user"**
4. Enter:
   - **Email**: `testuser@example.com` (or your preferred test email)
   - **Password**: `TestPassword123!` (or your preferred test password)
5. If email confirmation is enabled:
   - Either verify the email manually
   - Or temporarily disable email confirmation in **Authentication** → **Settings**

#### Via SQL (Alternative):
Run this in your Supabase SQL Editor:

```sql
-- Create test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'testuser@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### 3. Set Environment Variables

Create a `.env.test` file in the project root:

```env
# Required: Test user credentials
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPassword123!

# Optional: If different from .env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: For AI generation tests
OPENROUTER_API_KEY=sk-or-v1-your-key
```

**Important**: Make sure the email and password match the test user you created in Supabase!

### 4. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e generate.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Troubleshooting

### Tests Fail at Login

**Symptoms**: 
- `page.waitForURL: Test timeout of 30000ms exceeded`
- All tests failing in beforeEach hook

**Solutions**:
1. ✅ Verify test user exists in Supabase
2. ✅ Check TEST_USER_EMAIL and TEST_USER_PASSWORD are correct
3. ✅ Ensure email is confirmed (or disable email confirmation)
4. ✅ Check Supabase is accessible
5. ✅ View screenshot in `test-results/` directory

### Build Not Found

**Error**: `The server entrypoint does not exist`

**Solution**: Run `npm run build` first

### Port Already in Use

**Solution**: Stop any running dev server or change port in `playwright.config.ts`

## Test User Best Practices

### For Development:
- Use a dedicated test user separate from your personal account
- Email: `testuser@example.com`
- Password: Use a strong but memorable password

### For CI/CD:
- Store credentials as secrets in GitHub Actions, GitLab CI, etc.
- Use environment variables
- Consider using a separate Supabase project for CI tests

### Security:
- ⚠️ Never commit `.env.test` to git (it's in `.gitignore`)
- ⚠️ Never use production credentials for tests
- ⚠️ Consider using a separate Supabase project for tests

## Viewing Test Results

### HTML Report
```bash
npx playwright show-report
```

### Screenshots and Videos
Located in `test-results/` directory:
- Screenshots: Captured on failure
- Videos: Recorded on first retry
- Traces: Available for debugging

### Example Test Output Structure
```
test-results/
├── generate-Page-should-generate-flashcards-chromium/
│   ├── test-failed-1.png (screenshot)
│   ├── video.webm (video)
│   └── trace.zip (trace)
└── ...
```

## Running Specific Tests

```bash
# Run only tests matching pattern
npx playwright test -g "should generate"

# Run specific file
npx playwright test generate.spec.ts

# Run in specific browser
npx playwright test --project=chromium

# Update snapshots (for visual regression tests)
npx playwright test --update-snapshots
```

## CI/CD Setup Example

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Build application
        run: npm run build
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Next Steps

Once tests are passing:

1. ✅ **Add more test scenarios** as features are developed
2. ✅ **Consider mocking** AI responses for faster tests
3. ✅ **Set up CI/CD** to run tests automatically
4. ✅ **Monitor test flakiness** and fix unstable tests
5. ✅ **Update page objects** when UI changes

## Need Help?

- View generated screenshots in `test-results/`
- Check test traces with `npx playwright show-trace trace.zip`
- Run tests in debug mode: `npx playwright test --debug`
- Read full docs: `tests/e2e/README.md`


