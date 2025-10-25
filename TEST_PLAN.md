# Test Plan: 10x-Project AI Flashcard Application

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Test Strategy](#2-test-strategy)
- [3. Test Scope](#3-test-scope)
- [4. Test Environment & Tools](#4-test-environment--tools)
- [5. Test Cases by Priority](#5-test-cases-by-priority)
- [6. Risk Assessment](#6-risk-assessment)
- [7. Test Execution & Metrics](#7-test-execution--metrics)
- [8. CI/CD Integration](#8-cicd-integration)
- [9. Maintenance](#9-maintenance)

---

## 1. Executive Summary

### Project Overview
AI-powered flashcard application (Astro 5 + React 19 + Supabase + OpenRouter.ai) enabling users to generate flashcards from text input (1000-10000 characters).

### Testing Objectives
1. Verify all MVP features work correctly
2. Test AI integration, error handling, and rate limiting
3. Ensure data integrity (Supabase)
4. Achieve 80%+ code coverage for critical paths
5. Meet performance targets (< 5s generation, Core Web Vitals)

## 2. Test Strategy

### Testing Levels
- **Unit Testing (70%)**: Vitest + React Testing Library - Coverage 85%
- **Integration Testing (20%)**: Vitest + MSW - Coverage 75%
- **E2E Testing (10%)**: Playwright - All P0/P1 flows

### Testing Types
- **Functional**: Feature validation, input validation, state management
- **Performance**: Page load < 2s, AI generation < 5s, batch save < 500ms/card
- **Security**: Auth flows, session management, XSS prevention, rate limiting
- **Accessibility**: WCAG 2.1 AA, keyboard navigation, screen readers

### Environments
- **Local**: Mock AI, local Supabase
- **Staging**: Real OpenRouter (test key), staging Supabase
- **Production**: Smoke tests only

### Entry/Exit Criteria
**Entry**: Linting passes, no TS errors, feature complete, tests written  
**Exit**: All P0/P1 pass, coverage targets met, no critical bugs, performance OK

---

## 3. Test Scope

### In-Scope Features

#### Authentication Module
- ✅ User registration with email validation
- ✅ Login with email/password
- ✅ Password reset flow (request + reset)
- ✅ Session management and persistence
- ✅ Logout functionality
- ✅ Protected route middleware

#### AI Flashcard Generation
- ✅ Source text input with character count (1000-10000)
- ✅ Real-time validation feedback
- ✅ Draft persistence to localStorage
- ✅ API call to OpenRouter/Mock AI service
- ✅ Proposal rendering and display
- ✅ Generation status and elapsed time tracking
- ✅ Error handling (rate limits, auth errors, API failures)

#### Flashcard Management
- ✅ Proposal accept/reject actions
- ✅ Inline editing of proposals
- ✅ Edit state tracking (ai-full vs ai-edited)
- ✅ Front/back validation
- ✅ Batch save with progress tracking
- ✅ Duplicate detection
- ✅ Retry failed saves
- ✅ Save summary display

#### API Endpoints
- ✅ `POST /api/generations` - Generate proposals
- ✅ `POST /api/flashcards` - Create flashcards
- ✅ `POST /api/auth/logout` - User logout
- ✅ Request validation with Zod schemas
- ✅ Error response formatting

#### Services & Utilities
- ✅ `generation.service.ts` - Database operations for generations
- ✅ `flashcard.service.ts` - Flashcard CRUD operations
- ✅ `openrouter.service.ts` - AI integration
- ✅ `mock-ai.service.ts` - Mock AI for testing
- ✅ Validation schemas (auth, generation, flashcard)
- ✅ Error utilities (api-errors, auth-errors, openrouter-errors)
- ✅ Helper functions (generate-helpers, auth-helpers)

#### UI Components
- ✅ `LoginForm`, `RegisterForm`, `ResetPasswordForm`
- ✅ `SourceTextInput`, `GenerateButton`, `GenerationStatus`
- ✅ `ProposalCard`, `ProposalsList`
- ✅ `BatchSaveButton`, `BatchSaveProgress`, `SaveSummary`
- ✅ `RateLimitNotice`, `NavigationBar`

### Out-of-Scope
- Supabase/OpenRouter internals (mocked in tests)
- Third-party library internals
- Future features (spaced repetition, review sessions, statistics)
- Load testing (1000+ users), penetration testing, IE11 support

---

## 4. Test Environment & Tools

### Installation
```bash
# Install testing dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom msw @playwright/test axe-core jest-axe @lhci/cli

# Install Playwright browsers
npx playwright install --with-deps
```

### Configuration Files Required
- `vitest.config.ts` - Vitest configuration (coverage, setup, aliases)
- `playwright.config.ts` - Playwright E2E configuration
- `src/test/setup.ts` - Test setup (cleanup, mocks for matchMedia, localStorage, fetch)
- `src/test/mocks/handlers.ts` - MSW handlers for API mocking

### Testing Stack
- **Unit Testing**: Vitest + React Testing Library
- **API Mocking**: MSW (Mock Service Worker)
- **E2E Testing**: Playwright (Chrome, Firefox, Safari)
- **Accessibility**: axe-core + jest-axe
- **Performance**: Lighthouse CI
- **Coverage**: V8 (built into Vitest)

### NPM Scripts
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:a11y": "vitest run --grep 'accessibility'"
}
```

---

## 5. Test Cases by Priority

### P0 - Critical (Must Test Before Release)

**TC-P0-001: User Authentication Flow** ✅ E2E  
Complete registration, login, logout flow. Session persists until logout.

**TC-P0-002: Generate Flashcards from Text** ✅ Integration + E2E  
Generate 3-5 proposals from 1000+ char text within 5s.

**TC-P0-003: Accept and Save Flashcards** ✅ Integration + E2E  
Save accepted proposals to Supabase with progress tracking.

**TC-P0-004: Input Validation - Source Text Length** ✅ Unit + Integration  
Enforce 1000-10000 character limit with error messages.

**TC-P0-005: API Error Handling** ✅ Integration  
Display user-friendly messages for rate limits, 500 errors, auth failures.

### P1 - High Priority

**TC-P1-001: Edit Proposal Before Saving** ✅ Integration  
Inline editing of front/back text. Edited cards tracked as "ai-edited".

**TC-P1-002: Duplicate Detection** ✅ Unit + Integration  
Case-insensitive, whitespace-normalized duplicate detection. Summary shows duplicate count.

**TC-P1-003: Draft Persistence** ✅ Unit  
Source text auto-saved to localStorage (500ms debounce), restored on page refresh.

**TC-P1-004: Password Reset Flow** ⚠️ Partial E2E  
Complete password reset process via email link.

**TC-P1-005: Batch Save Progress Tracking** ✅ Integration  
Track each flashcard: pending → saving → success/error. Display final summary.

### P2 - Medium Priority

**TC-P2-001: Rate Limit Countdown** ✅ Integration  
Display countdown timer when rate limited. Re-enable button after timeout.

**TC-P2-002: Unsaved Changes Warning** ✅ Integration  
Browser warning before leaving page with unsaved accepted proposals.

**TC-P2-003: Retry Failed Saves** ✅ Integration  
Individually retry failed flashcard saves without affecting successful ones.

**TC-P2-004: Mobile Responsive Layout** ✅ E2E  
Verify layout on mobile (375x667). Touch targets 44x44px min.

### P3 - Low Priority

**TC-P3-001: Dark Mode Toggle** ⚠️ Partial  
Theme switching with localStorage persistence.

**TC-P3-002: Elapsed Time Display** ✅ Integration  
Real-time elapsed time counter during generation.

**TC-P3-003: Character Count Display** ✅ Integration  
Real-time character count with color feedback (gray/green/red).

---

## 6. Risk Assessment

### High-Risk Areas

**1. OpenRouter API Integration**  
**Risk**: Rate limits, downtime, unexpected responses  
**Mitigation**: Mock service for tests, error handling, retries, monitoring  
**Tests**: MSW integration tests (success, failure, rate limit, timeout)

**2. Data Loss During Batch Save**  
**Risk**: Network errors, browser crashes  
**Mitigation**: Per-flashcard tracking, retry logic, unsaved changes warning  
**Tests**: Network failure simulation, partial saves, retry logic

**3. Authentication Session Management**  
**Risk**: Token expiry during generation  
**Mitigation**: Auto token refresh, graceful error handling, state persistence  
**Tests**: E2E session expiry, integration token refresh

**4. Duplicate Detection False Positives**  
**Risk**: Legitimate flashcards blocked  
**Mitigation**: Normalized comparison, show duplicate details, force save option  
**Tests**: Unit tests (exact, case, whitespace variations)

**5. Performance with Large Text Input**  
**Risk**: UI lag with 10K characters  
**Mitigation**: Debounce updates, loading indicators, 30s timeout  
**Tests**: Performance tests with max-length inputs

### Critical Dependencies
- **Supabase**: Local instance for testing
- **OpenRouter API**: Mock service for dev/test, multiple keys
- **Node.js 22.14.0**: Document in README, use nvm
- **CI/CD Pipeline**: GitHub Actions workflow required

---

## 7. Test Execution & Metrics

### Smoke Test Suite (15 min)
- App loads, login, generate, save, logout, no JS errors
- **Execution**: Playwright on every PR

### Regression Suite (2 hours)
- All P0/P1 tests, selected P2, performance, accessibility, cross-browser
- **Execution**: CI/CD on `develop` merges

### Performance Targets
- Page Load < 2s (3G), Time to Interactive < 3s, FCP < 1.5s
- AI Generation < 5s, Batch Save < 500ms/card
- Memory < 50MB after 10 generations

### Coverage Targets
| Category | Target |
|----------|--------|
| Overall | 80% |
| P0/P1 Paths | 90% |
| Services/Utils | 85% |
| API Endpoints | 90% |
| Components | 75% |
| Custom Hooks | 90% |

### Quality KPIs
- Test Pass Rate ≥ 95% (per PR)
- Bug Escape Rate < 5% (per release)
- Mean Time to Fix < 2 days
- Lighthouse Score ≥ 90
- Accessibility Score 100 (axe)

### Reporting Tools
- **Coverage**: `npm run test:coverage` → Codecov
- **CI/CD**: GitHub Actions
- **E2E Reports**: Playwright HTML

---

## 8. CI/CD Integration

### Pre-Commit Hooks
Configure in `package.json` lint-staged:
- ESLint fix + Vitest related tests for `*.{ts,tsx,astro}`
- Prettier for `*.{json,css,md}`

### PR Validation Workflow
Create `.github/workflows/pr-validation.yml`:
- **lint**: ESLint check
- **unit-tests**: Vitest + Codecov upload
- **integration-tests**: With Postgres service
- **e2e-tests**: Playwright (Chrome, Firefox, Safari) + artifact upload

### Deployment Gates
- **Develop**: Unit + Integration, 75% coverage, automated
- **Staging**: Full Regression + E2E, 80% coverage, QA approval
- **Production**: Smoke tests, Product Owner approval

---

## 9. Maintenance

### Accessibility (WCAG 2.1 AA)
**Checklist**:
- Keyboard navigation (tab order, focus indicators, no traps)
- Screen readers (alt text, labels, ARIA landmarks, aria-live)
- Color contrast (4.5:1 normal text, 3:1 large text, 3:1 focus)
- Semantic HTML (heading hierarchy, lang attribute)

**Testing**:
- Automated: `jest-axe` in component tests
- Manual: Keyboard-only navigation, NVDA/VoiceOver, 200% zoom, high contrast

### Performance (Core Web Vitals)
**Targets**:
- LCP < 2.5s, FID < 100ms, CLS < 0.1
- FCP < 1.8s, TTI < 3.8s

**Budget**:
- JS < 300KB, CSS < 100KB, Images < 500KB
- Total page < 1MB, < 50 HTTP requests

**Testing**:
- Lighthouse CI: `npx lhci autorun`
- Configure `.lighthouserc.js` (min scores: 0.9 performance, 1.0 a11y)
- Real user monitoring: Vercel Analytics/Sentry

### Maintenance Schedule
- **Quarterly**: Review test cases, update test plan (8h)
- **Monthly**: Fix flaky tests, update dependencies (4-6h)
- **Per Release**: Performance benchmarks, accessibility audit (6h)
- **As Needed**: Update fixtures after data model changes (2h)

### Update Triggers
- New feature, bug fix, data model change, API change, UI change
- Process: Identify affected tests → update/create tests → update fixtures → run regression → update docs

### Continuous Improvement
- Track: Test execution time, flaky test rate, coverage trends, bug detection rate
- Quarterly Review: Testing right things? Catching bugs? Reasonable effort? Untested areas?

---

## Quick Reference

### Setup Commands
```bash
# Install all testing tools
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jsdom msw @playwright/test axe-core jest-axe @lhci/cli

# Install Playwright browsers
npx playwright install --with-deps
```

### Test Commands
```bash
npm test                      # Run all tests (watch mode)
npm run test:run             # Run once
npm run test:coverage        # With coverage report
npm run test:e2e             # E2E tests
npm run test:e2e:ui          # E2E UI mode
npm run test:a11y            # Accessibility tests
npx lhci autorun             # Performance audit
```

### Key Files
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - E2E configuration
- `src/test/setup.ts` - Test setup & mocks
- `src/test/mocks/handlers.ts` - MSW API handlers
- `.github/workflows/pr-validation.yml` - CI/CD workflow

---

**Document Version**: 1.0 | **Date**: 2025-01-15 | **Author**: AI Assistant

