# Authentication System Specification - 10x-cards

> **Note:** This document defines authentication architecture. For business requirements, see `prd.md` (US-001, US-002, US-009). For API contracts, see `api-plan.md`. For database schema, see `db-plan.md`.

**Version:** 1.0  
**Stack:** Astro 5 + React 19 + Supabase Auth  
**Scope:** Registration, login, logout, password recovery, session management

---

## 1. Pages & Routing

| Page | Path | Auth Required | Description |
|------|------|---------------|-------------|
| Login | `/auth/login` | No | Login form, redirects if authenticated |
| Register | `/auth/register` | No | Registration form with email confirmation |
| Forgot Password | `/auth/forgot-password` | No | Request password reset email |
| Reset Password | `/auth/reset-password` | No | Set new password (from email link) |
| Email Confirm | `/auth/confirm` | No | Callback for email verification |
| Home | `/` | No | Redirects to `/generate` or `/auth/login` |
| Generate | `/generate` | Yes | Requires auth, shows NavigationBar |

**Redirect Logic:**
- Unauthenticated users accessing protected pages → `/auth/login?redirect={original_path}`
- Authenticated users accessing auth pages → `/generate`

---

## 2. Components

### 2.1 Astro Pages (SSR)

| File | Responsibilities |
|------|-----------------|
| `src/pages/auth/login.astro` | Session check, URL params handling, render LoginForm |
| `src/pages/auth/register.astro` | Session check, render RegisterForm |
| `src/pages/auth/forgot-password.astro` | Session check, render ForgotPasswordForm |
| `src/pages/auth/reset-password.astro` | Token verification, render ResetPasswordForm |
| `src/pages/auth/confirm.astro` | Email confirmation callback, redirect to login |
| `src/pages/index.astro` | **Update:** Session-based redirect |
| `src/pages/generate.astro` | **Update:** Auth check + NavigationBar |

**SSR Pattern:** All protected pages check `Astro.locals.session`, redirect if null to `/auth/login?redirect={path}`

### 2.2 React Components (Client-Side)

| Component | Location | Key Functions |
|-----------|----------|---------------|
| LoginForm | `src/components/auth/LoginForm.tsx` | Email/password form, `signInWithPassword()`, validation, error display |
| RegisterForm | `src/components/auth/RegisterForm.tsx` | Registration form, `signUp()`, password confirmation, success message |
| ForgotPasswordForm | `src/components/auth/ForgotPasswordForm.tsx` | Email form, `resetPasswordForEmail()`, success message |
| ResetPasswordForm | `src/components/auth/ResetPasswordForm.tsx` | New password form, read token from URL hash, `updateUser()` |
| NavigationBar | `src/components/layout/NavigationBar.tsx` | Display user email, logout button, `signOut()` |

**Component State:** Each form manages loading state, validation errors, API errors, and success states.

### 2.3 New Layout

**File:** `src/layouts/AuthLayout.astro`

Purpose: Centered form layout with gradient background for all auth pages. Contains logo, page title area, and content slot.

---

## 3. Authentication Flow

### 3.1 Middleware

**File:** `src/middleware/index.ts`

**Changes:**
- Replace singleton `supabaseClient` with per-request `createServerClient` from `@supabase/ssr`
- Configure cookie handlers (get, set, remove) using `context.cookies`
- Call `getSession()` to retrieve current session from cookies
- Store `session` and `user` in `context.locals` for SSR access

**Type Updates:** `src/env.d.ts`

Add to `App.Locals`:
- `session: Session | null`
- `user: User | null`

Add to `ImportMetaEnv`:
- `PUBLIC_SUPABASE_URL: string`
- `PUBLIC_SUPABASE_KEY: string`

### 3.2 Browser Client

**File:** `src/lib/utils/supabase-browser.ts`

Purpose: Singleton Supabase client for browser using `createBrowserClient` from `@supabase/ssr`. Uses public env vars.

Used by all React auth components for client-side auth operations.

---

## 4. Validation

### 4.1 Validation Schemas

**File:** `src/lib/validation/auth.schemas.ts`

| Schema | Fields | Rules |
|--------|--------|-------|
| EmailSchema | email | Required, valid email format |
| PasswordLoginSchema | password | Required (no complexity check) |
| PasswordRegisterSchema | password | Min 8 chars, uppercase, lowercase, digit |
| LoginFormSchema | email, password | Combines above |
| RegisterFormSchema | email, password, confirmPassword | Passwords must match |
| ResetPasswordFormSchema | password, confirmPassword | Same as RegisterFormSchema |

Use Zod for all schemas, export TypeScript types with `z.infer`.

### 4.2 Error Messages

| Validation Error | Message |
|-----------------|---------|
| Email empty | "Email is required" |
| Email invalid | "Please enter a valid email address" |
| Password empty | "Password is required" |
| Password too short | "Password must be at least 8 characters" |
| Missing uppercase | "Password must contain at least one uppercase letter" |
| Missing lowercase | "Password must contain at least one lowercase letter" |
| Missing digit | "Password must contain at least one number" |
| Passwords mismatch | "Passwords must match" |

| Supabase API Error | User Message |
|-------------------|--------------|
| `invalid_credentials` | "Invalid email or password" |
| `email_not_confirmed` | "Please confirm your email before logging in" |
| `user_already_exists` | "This email is already registered" |
| `weak_password` | "Password does not meet security requirements" |
| `invalid_grant` | "Reset link has expired or is invalid" |
| HTTP 429 | "Too many attempts. Please try again later" |
| Network error | "Connection error. Please check your internet" |

**Implementation:** `src/lib/utils/auth-errors.ts` - Map Supabase error codes to user-friendly messages.

---

## 5. API Endpoint Updates

### 5.1 Authorization Pattern

All existing and future API endpoints require authentication check:

**Steps:**
1. Extract `session` and `user` from `locals`
2. If null, return 401 with `AUTHENTICATION_REQUIRED` error
3. Pass `user.id` to service layer functions
4. RLS policies in database enforce data isolation

### 5.2 Endpoints to Update

| Endpoint | Required Changes |
|----------|-----------------|
| `POST /api/flashcards` | Add auth check at start, pass `user.id` to `createFlashcards()` |
| `POST /api/generations` | Add auth check at start, pass `user.id` to generation service |
| Future GET/PUT/DELETE | Add auth check for all operations |

### 5.3 Service Layer Updates

**Files:**
- `src/lib/services/flashcard.service.ts`
- `src/lib/services/generation.service.ts`

**Changes:**
- Add `userId: string` parameter to all functions
- Map `userId` to `user_id` field when inserting records
- Database RLS policies automatically enforce user owns the data

---

## 6. Supabase Auth Configuration

### 6.1 Dashboard Settings

**Authentication > Settings:**

| Setting | Value | Description |
|---------|-------|-------------|
| Enable email confirmations | Enabled | Users must verify email before login |
| Minimum password length | 8 | Enforced by Supabase |
| Site URL | Production domain | Used in email links |
| Redirect URLs | `/auth/confirm`, `/auth/reset-password` | Whitelist for both dev and prod domains |

### 6.2 Email Templates

Customize in **Authentication > Email Templates**:

**Confirm signup:**
- Subject: "Confirm your email - 10x Cards"
- Body: Welcome message with confirmation link, explain 24h validity
- CTA: "Confirm Email" button/link

**Reset password:**
- Subject: "Reset your password - 10x Cards"
- Body: Password reset instructions with link, explain 1h validity
- CTA: "Reset Password" button/link
- Note: Mention to ignore if not requested

### 6.3 Session Tokens

| Token | Lifetime | Storage | Auto-Refresh |
|-------|----------|---------|--------------|
| Access token (JWT) | 1 hour | httpOnly cookie | Yes |
| Refresh token | 30 days | httpOnly cookie | N/A |

Supabase SDK handles token refresh automatically. Use `getSession()` (reads from cookie) not `getUser()` (makes API call) in middleware.

---

## 7. Security & RLS

### 7.1 Row Level Security

**Existing policies** (no changes needed) ensure:
- Users can only SELECT/INSERT/UPDATE/DELETE their own flashcards
- Users can only SELECT/INSERT their own generations
- Database enforces `auth.uid() = user_id` check

Policy files: `supabase/migrations/20251013120200_enable_rls_policies.sql`

**Mechanism:**
1. JWT token contains `user_id`
2. Supabase sets `auth.uid()` in database context
3. RLS policies compare with table's `user_id` column
4. Access denied if mismatch

### 7.2 Security Features

| Protection | Implementation |
|------------|---------------|
| XSS | httpOnly cookies, React auto-escaping |
| CSRF | SameSite cookies |
| SQL Injection | Supabase parameterized queries |
| Brute Force | Supabase rate limiting |
| Session Hijacking | HTTPS only (production), short token lifetime |
| Password Strength | Validation on client + Supabase |

---

## 8. User Flows

### 8.1 Registration

1. User fills form: email, password, confirm password
2. Client validation (Zod schema)
3. Submit → `supabase.auth.signUp()` with `emailRedirectTo`
4. Supabase creates user, sends confirmation email
5. Show success: "Account created! Check your email to confirm your registration"
6. User clicks email link → `/auth/confirm`
7. Confirm page verifies token, redirects to login with message: "Email confirmed successfully. Please log in"

### 8.2 Login

1. User fills form: email, password
2. Client validation
3. Submit → `supabase.auth.signInWithPassword()`
4. Supabase validates, returns session, sets cookies
5. Redirect to `/generate` or original `redirect` param
6. Middleware reads session from cookies, grants access

### 8.3 Password Recovery

1. User clicks "Forgot password" → form with email field
2. Submit → `supabase.auth.resetPasswordForEmail()` with `redirectTo`
3. Supabase sends email with reset link
4. Show message: "Password reset link sent. Check your email"
5. User clicks email link → `/auth/reset-password#access_token=...`
6. Component reads token from URL hash, calls `setSession()`
7. User enters new password, submits → `updateUser()`
8. Redirect to login with message: "Password changed successfully. Please log in"

### 8.4 Logout

1. User clicks logout in NavigationBar
2. Call `supabase.auth.signOut()`
3. Supabase clears cookies
4. Redirect to `/auth/login`

---

## 9. Helper Utilities

### 9.1 Auth Helpers

**File:** `src/lib/utils/auth-helpers.ts`

| Function | Purpose |
|----------|---------|
| `isAuthenticated(session)` | Returns boolean |
| `getUserId(session)` | Extracts user ID, throws if null |
| `getUserEmail(user)` | Extracts email |
| `validateRedirectPath(path)` | Whitelist check, returns safe path |

### 9.2 Error Mapping

**File:** `src/lib/utils/auth-errors.ts`

Function: `mapAuthError(error)` - Converts Supabase AuthError to user-friendly message using error code lookup table.

---

## 10. Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Update `src/middleware/index.ts` with per-request client
- [ ] Update `src/env.d.ts` types
- [ ] Create `src/lib/utils/supabase-browser.ts`
- [ ] Create `src/lib/utils/auth-helpers.ts`
- [ ] Create `src/lib/utils/auth-errors.ts`
- [ ] Create `src/lib/validation/auth.schemas.ts`

### Phase 2: Pages & Layout
- [ ] Create `src/layouts/AuthLayout.astro`
- [ ] Create `src/pages/auth/login.astro`
- [ ] Create `src/pages/auth/register.astro`
- [ ] Create `src/pages/auth/forgot-password.astro`
- [ ] Create `src/pages/auth/reset-password.astro`
- [ ] Create `src/pages/auth/confirm.astro`
- [ ] Update `src/pages/index.astro`
- [ ] Update `src/pages/generate.astro`

### Phase 3: React Components
- [ ] Create `src/components/auth/LoginForm.tsx`
- [ ] Create `src/components/auth/RegisterForm.tsx`
- [ ] Create `src/components/auth/ForgotPasswordForm.tsx`
- [ ] Create `src/components/auth/ResetPasswordForm.tsx`
- [ ] Create `src/components/layout/NavigationBar.tsx`

### Phase 4: API Integration
- [ ] Update `src/pages/api/flashcards/index.ts`
- [ ] Update `src/pages/api/generations/index.ts`
- [ ] Update `src/lib/services/flashcard.service.ts`
- [ ] Update `src/lib/services/generation.service.ts`

### Phase 5: Configuration
- [ ] Add public env vars to `.env`
- [ ] Configure Supabase Dashboard settings
- [ ] Customize email templates
- [ ] Test all auth flows
- [ ] Verify RLS enforcement

---

## 11. Dependencies

**Add to package.json:**
- `@supabase/ssr`: `^0.1.0`

**Verify existing:**
- `@supabase/supabase-js`: `^2.39.0`

---

## 12. Environment Variables

**.env additions:**
```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

**Existing (keep):**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_key
OPENROUTER_DEFAULT_MODEL=your_model
```

---

## 13. Files Summary

### New Files (16)

**Astro Pages (5):**
- `src/pages/auth/login.astro`
- `src/pages/auth/register.astro`
- `src/pages/auth/forgot-password.astro`
- `src/pages/auth/reset-password.astro`
- `src/pages/auth/confirm.astro`

**React Components (5):**
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/components/layout/NavigationBar.tsx`

**Utilities (4):**
- `src/lib/utils/supabase-browser.ts`
- `src/lib/utils/auth-helpers.ts`
- `src/lib/utils/auth-errors.ts`
- `src/lib/validation/auth.schemas.ts`

**Layout (1):**
- `src/layouts/AuthLayout.astro`

**Optional (1):**
- `src/pages/api/auth/logout.ts` (can handle logout client-side)

### Modified Files (6)

- `src/middleware/index.ts` - Per-request client, session management
- `src/env.d.ts` - Type definitions for locals and env vars
- `src/pages/index.astro` - Session-based routing
- `src/pages/generate.astro` - Auth requirement, NavigationBar
- `src/lib/services/flashcard.service.ts` - userId parameter
- `src/lib/services/generation.service.ts` - userId parameter

---

## 14. Edge Cases Handling

| Scenario | Solution |
|----------|----------|
| Email not confirmed on login | Show error with "Resend confirmation email" link |
| Password reset link expired | Show error, link back to forgot-password page |
| Invalid/missing reset token | Show error, redirect to login |
| Session expired (user idle) | Middleware redirects to login with session_expired message |
| Multi-tab logout | Use `onAuthStateChange` event listener to sync logout |
| Network error during auth | Show friendly error, allow retry |
| User already registered | Show error with link to login page |
| Rate limit hit | Show error with retry-after message |

---

## 15. UI/UX Guidelines

**Forms:**
- Use Shadcn/ui components: Form, Input, Button, Label
- Show inline validation errors below fields
- Disable submit button during loading
- Show loading spinner on button during submission
- Display success messages prominently

**Error Display:**
- Field-level errors: below input, red text
- API errors: alert/banner at top of form
- Network errors: suggest checking internet connection

**Redirects:**
- Use `window.location.href` for full page reload (fresh session)
- Preserve `redirect` param through auth flow
- Show success messages via URL params + toast/banner

**Accessibility:**
- Proper ARIA labels on all inputs
- Error messages linked with `aria-describedby`
- Focus management (errors, success states)
- Keyboard navigation support

---

## 16. Testing Scenarios

**Registration:**
- [ ] Valid data creates user, sends email
- [ ] Duplicate email shows error
- [ ] Weak password rejected
- [ ] Password mismatch shows error
- [ ] Email confirmation link works
- [ ] Expired confirmation handled

**Login:**
- [ ] Valid credentials grant access
- [ ] Invalid credentials show error
- [ ] Unconfirmed email blocked
- [ ] Rate limit prevents brute force
- [ ] Redirect param works

**Password Reset:**
- [ ] Email sent for existing user
- [ ] Email not sent for non-existent (security)
- [ ] Reset link works within 1 hour
- [ ] Expired link handled
- [ ] Password updated successfully

**Authorization:**
- [ ] Protected pages redirect unauth users
- [ ] API returns 401 for unauth requests
- [ ] Users can only access own data (RLS)
- [ ] Session persists across page loads
- [ ] Logout clears session

**Edge Cases:**
- [ ] Network failures handled gracefully
- [ ] Multi-tab logout works
- [ ] Token refresh happens automatically
- [ ] Invalid redirect params sanitized

---

**Version:** 1.0  
**Last Updated:** 2025-10-21  
**Status:** Ready for implementation  
**PRD Alignment:** US-001, US-002, US-009  
**Compatibility:** US-003, US-004 (existing flashcard generation)
