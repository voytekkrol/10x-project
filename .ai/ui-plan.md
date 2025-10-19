## UI Architecture for 10x-cards

### 1. UI Structure Overview

- **App shell (protected)**: Header with product name, primary navigation (Generate, Flashcards), search-less MVP, user menu (account, sign out), theme toggle, language switcher; main content area; global toast region; global error boundary; footer (minimal).
- **Public routes**: `/auth/login`, `/auth/register`.
- **Protected routes**: `/app/generate`, `/app/flashcards`, `/app/user` (basic account panel). Generations history is out of scope for MVP.
- **Protection**: Astro middleware checks Supabase session on `/app/*`. Client `AuthGuard` re-validates on mount, attempts token refresh on 401; failing refresh redirects to `/auth/login`.
- **State**: React hooks + Context (AuthContext, GenerationContext, FlashcardsContext). LocalStorage for generation draft and proposal selections.
- **A11y & i18n**: shadcn/ui components with focus traps; visible focus states; aria-live toasts; Polish-first via i18next with English fallback; reduced motion respect.
- **Error/limits**: Normalized API error display (inline for 422, toast for generic). 429 shows retry-after countdown. 503 shows service unavailable message.

### 2. View List

#### Auth: Login
- **View path**: `/auth/login`
- **Main purpose**: Authenticate existing users to access protected features.
- **Key information to display**: Email, password, error messages (invalid credentials, locked account), link to register.
- **Key view components**: Form (email, password), submit button (loading state), password visibility toggle, error summary, link to registration.
- **UX, accessibility, and security considerations**:
  - Keyboard-first form, labels and descriptions, appropriate input types, prevent autofill pitfalls, error messages linked to fields.
  - Limit brute force via backend; on repeated failures, generic errors; no detailed auth errors.
  - On success, redirect to `/app/generate`.
  - **Requirements mapping**: US-002.

#### Auth: Register
- **View path**: `/auth/register`
- **Main purpose**: Create a new user account.
- **Key information to display**: Email, password (policy hints), consent text, error messages.
- **Key view components**: Registration form, submit button (loading), legal copy links, success notice.
- **UX, accessibility, and security considerations**:
  - Accessible validation (inline 422 feedback), password policy helper, prevent duplicate submissions.
  - On success, auto-login and redirect to `/app/generate`.
  - **Requirements mapping**: US-001.

#### App Shell (Protected Layout)
- **View path**: `/app/*` (layout)
- **Main purpose**: Provide consistent, protected frame for app views.
- **Key information to display**: Current route highlighting, user identity (email/avatar), theme and language controls.
- **Key view components**: Header/Nav (Generate, Flashcards), UserMenu (Account, Sign out), ThemeToggle, LanguageSwitcher, Breadcrumb (optional later), ToastRegion, ErrorBoundary, AuthGuard.
- **UX, accessibility, and security considerations**:
  - High contrast, focus outline, skip-to-content link.
  - Guard blocks rendering until auth state known; show small loading shimmer.
  - Sign out clears session securely.
  - **Requirements mapping**: US-009.

#### Generate (Dashboard)
- **View path**: `/app/generate`
- **Main purpose**: Generate flashcard proposals from pasted source text and accept selected items into the user’s deck.
- **Key information to display**:
  - Textarea with live character count and validation (1,000–10,000 after trim/normalize).
  - Generation status (spinner with elapsed time), generated_count, generated_duration.
  - List of proposals (front/back). Empty/none state.
  - Post-save summary (successes, edits, duplicates skipped, failures with retry hints).
- **Key view components**:
  - SourceTextArea with live counter, validation messages, auto-save draft, unload warning.
  - GenerateButton (disabled out-of-range), global loader with elapsed time.
  - ProposalsList (≤10 cards), ProposalCard (front/back, inline edit, accept, reject), SelectAll checkbox.
  - BatchSaveBar (Save selected), BatchSaveProgress (sequential posting, per-item status, overall summary).
- **UX, accessibility, and security considerations**:
  - Inline field-level errors for invalid lengths; status announced via aria-live.
  - Prevent accidental navigation during unsaved selections (dialog/unload guard).
  - Client-side deduplication using normalized front+back; classify saved items as `ai-full` vs `ai-edited`; include `generation_id`.
  - Respect 429 with visible countdown; allow individual retry for failed items.
  - **API alignment**: POST `/api/generations`, POST `/api/flashcards` with `source`, `generation_id`.
  - **Requirements mapping**: US-003, US-004.

#### Flashcards List & Manage
- **View path**: `/app/flashcards`
- **Main purpose**: View, filter, create manually, edit, and delete saved flashcards.
- **Key information to display**:
  - Paginated list (default limit=20) sorted by `-created_at`.
  - Columns: front (truncated), back (truncated), source (`manual|ai-full|ai-edited`), generation_id (if any), created_at.
  - Filters: source, optional generation_id; sorting controls; pagination with RFC5988 Link headers.
- **Key view components**:
  - FlashcardsTable or CardList, EmptyState.
  - FiltersBar (source select, generation_id input), SortControl, PaginationControls (prev/next, page numbers), LinkHeaderConsumer.
  - AddFlashcardButton -> CreateFlashcardModal (front/back inputs, validation 1–200/1–500).
  - EditFlashcardAction -> EditFlashcardModal (front/back), DeleteFlashcardAction -> ConfirmDialog.
- **UX, accessibility, and security considerations**:
  - Optimistic updates with clear undo opportunity for delete (if feasible later), keyboard accessible modals with focus trapping.
  - Inline 422 field errors for create/update; generic errors via toast.
  - Enforce RLS via backend; client filters only display own data.
  - **API alignment**: GET/POST/PUT/DELETE `/api/flashcards` with `page`, `limit`, `source`, `sort`, `generation_id`.
  - **Requirements mapping**: US-005 (edit), US-006 (delete), US-007 (manual create), US-009 (secure access).

#### User Panel (Basics)
- **View path**: `/app/user`
- **Main purpose**: Basic account settings and account deletion request.
- **Key information to display**: Email, session info, theme preference, language preference; account deletion action (with strong confirmation and info about data removal timeline).
- **Key view components**: AccountSummaryCard, Preferences (theme, language), DeleteAccountSection with ConfirmDialog.
- **UX, accessibility, and security considerations**:
  - Clear irreversible action messaging; double-confirmation; password re-entry flow (if required by backend auth policy).
  - **Requirements mapping**: US-009; supports legal requirement for data deletion initiation from PRD.

#### Not Found
- **View path**: `/404`
- **Main purpose**: Graceful handling of unknown routes.
- **Key information to display**: Short message and link back to `/app/generate` (if authenticated) or `/auth/login`.
- **Key view components**: Message, PrimaryButton.
- **UX, accessibility, and security considerations**: Clearly visible focusable link; no sensitive data exposed.

### 3. User Journey Map

- **New user onboarding**:
  1) Visit `/auth/register` → submit valid credentials → auto-login → redirect to `/app/generate`.
  2) Paste text (1,000–10,000 chars) → click Generate → see loader with elapsed time → proposals render.
  3) Review proposals → accept/reject individually or Select all → inline edit where needed.
  4) Click Save selected → sequential saves with per-item status → summary shows successes/edits/duplicates/failed with retry/
  5) Navigate to `/app/flashcards` to view/manage saved cards; optionally add manual cards; edit or delete as needed.

- **Returning user**:
  1) Visit `/auth/login` → authenticate → `/app/generate` by default.
  2) Either generate new proposals or navigate to `/app/flashcards` to manage existing cards.

- **Auth/session edge**:
  - On 401 during any API call: attempt token refresh; if refresh fails, redirect to `/auth/login` with message.

- **Rate limiting/error handling**:
  - On 429: show retry-after countdown (seconds); disable relevant actions until reset; allow queueing where safe.
  - On 503 (generation): show non-destructive error with retry suggestion; draft preserved.

### 4. Layout and Navigation Structure

- **Header/Nav (protected)**: Left logo; center nav links (Generate, Flashcards); right user menu (Account, Sign out), ThemeToggle, LanguageSwitcher. Active route highlighted; mobile collapses to a menu button opening a Drawer with the same links and controls.
- **Navigation rules**:
  - Default post-login route: `/app/generate`.
  - Primary nav between Generate and Flashcards is always available when authenticated.
  - User Panel accessible via user menu.
  - URL reflects list state in Flashcards (`page`, `limit`, `source`, `sort`, `generation_id`).
- **Layouts**:
  - Public layout for `/auth/*` with minimal chrome.
  - Protected layout for `/app/*` with guard, header, toast region, error boundary.

### 5. Key Components

- **AuthGuard**: Blocks child rendering until auth state known; handles refresh on 401; redirects to login on failure.
- **SourceTextArea**: Normalizes text, tracks length (1,000–10,000), shows count and errors, autosaves draft, warns on unload.
- **GenerateButton & Loader**: Disabled out-of-range; shows indeterminate progress with elapsed time while awaiting `/api/generations`.
- **ProposalsList / ProposalCard**: Displays generated front/back; actions: accept, reject, inline edit; shows edited state; selection with Select all.
- **BatchSaveBar & BatchSaveProgress**: Sequential POST `/api/flashcards` per selected proposal; client dedup by normalized front+back; mark `source` as `ai-full` or `ai-edited`; include `generation_id`; per-item success/error; final summary.
- **FlashcardsTable/CardList**: Displays saved flashcards with columns and truncation; supports row actions (edit, delete); empty state.
- **CreateFlashcardModal / EditFlashcardModal**: Accessible modal with focus trap; validates `front` 1–200, `back` 1–500; shows inline 422 errors.
- **ConfirmDialog (Delete)**: Double-confirm destructive action; announces via aria-live; optimistic UI with fallback recovery if needed.
- **FiltersBar / SortControl / PaginationControls**: Sync with URL params; consume RFC5988 Link headers for next/prev; show totals.
- **RateLimitCountdown**: Reads retry-after from 429 responses; disables relevant actions; shows accessible countdown.
- **ToastRegion & ErrorBoundary**: Centralized notifications and error capture without losing context; user-safe messages.
- **ThemeToggle & LanguageSwitcher**: Persisted preferences; accessible toggles with clear labels.

---

Notes on compatibility and coverage:
- **API compatibility**: Endpoints used align with plan: POST `/api/generations`; GET/POST/PUT/DELETE `/api/flashcards`; query params for listing; headers for pagination; standardized error format observed.
- **User story mapping**: US-001/002 (Auth), US-003/004 (Generate), US-005/006/007 (Flashcards manage), US-009 (Protection). US-008 (Study session) explicitly out of MVP; future route `/app/study` can be added later.
- **Legal/privacy**: Account deletion initiation via `/app/user`; data access limited to owner via RLS; no sharing features in MVP.

