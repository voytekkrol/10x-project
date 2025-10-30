## API Endpoint Implementation Plan: flashcard-get-implementation-plan

### 1. Endpoint Overview
- **Purpose**: Retrieve a single flashcard by its identifier.
- **Route**: `GET /api/flashcards/:id`
- **Behavior**: Returns a `FlashcardDTO` if found and accessible by the authenticated user; otherwise returns an appropriate error.

### 2. Request Details
- **HTTP Method**: GET
- **URL Structure**: `/api/flashcards/:id`
- **Parameters**:
  - **Path (required)**: `id` (integer, positive, safe <= 2^53-1)
  - **Query**: none
  - **Headers**: Authentication (handled via Supabase session in `locals`)
- **Request Body**: none

### 3. Used Types
- **DTOs** (from `src/types.ts`):
  - `FlashcardDTO` (fields: `id`, `front`, `back`, `source`, `generation_id`, `created_at`, `updated_at`)
- **Domain/DB**:
  - `flashcards` table (columns and constraints per DB resources)
- **Validation**:
  - Zod schema for path param: `flashcardIdParamSchema`

### 4. Response Details
- **200 OK**: Returns a single `FlashcardDTO` JSON object.
- **400 Bad Request**: Invalid `id` format (non-integer, <= 0, too large), or validation errors.
- **401 Unauthorized**: No authenticated user session.
- **404 Not Found**: Flashcard does not exist or is not accessible under RLS (ownership).
- **500 Internal Server Error**: Unexpected server-side errors.

### 5. Data Flow
1. Request arrives at `src/pages/api/flashcards/[id].ts` (Astro server endpoint).
2. Retrieve Supabase client from `Astro.locals` (per backend rules) and current session/user.
3. Validate `:id` path param with Zod (`flashcardIdParamSchema`). If invalid → 400.
4. Call service `flashcard.service.getFlashcardById({ supabase, id, userId })`:
   - Executes a `select` on `flashcards` scoped by RLS (or explicit `eq('user_id', userId)` as a defense-in-depth) and `eq('id', id)`.
   - Maps DB row to `FlashcardDTO` (exclude `user_id`).
   - Returns `null` if not found.
5. If service returns `null` → 404. If returns DTO → 200 with JSON.
6. Errors are normalized via `api-errors` utilities before responding.

### 6. Security Considerations
- **Authentication**: Require valid Supabase session; reject anonymous with 401.
- **Authorization**: Enforce RLS on `flashcards` table; additionally filter by `user_id` = current user UUID.
- **IDOR Prevention**: Never return records owned by other users; rely on RLS and explicit user filter.
- **Input Validation**: Strict Zod validation of `id` (integer, positive, safe).
- **Error Leakage**: Do not disclose existence of resources belonging to other users; respond with 404 for both not-found and forbidden-by-RLS cases.
- **Rate Limiting**: Optional future enhancement at middleware (not required here).
- **Headers/CORS**: Use Astro defaults; no sensitive headers in response.

### 7. Error Handling
- Use `src/lib/utils/api-errors.ts` and `src/lib/utils/auth-errors.ts` where applicable for consistent error payloads.
- Map Supabase errors:
  - Auth/session missing → 401.
  - Query returns empty → 404.
  - Validation failures → 400 with validation details.
  - Unexpected exceptions → 500 with generic message.
- Logging: Use server console with structured context for unexpected errors; if an error table exists later, integrate via a logger service. Keep payloads user-safe.

### 8. Performance Considerations
- Single-row lookup by primary key is O(1) with index; ensure query uses `id` equality.
- Select only required columns (`id, front, back, source, generation_id, created_at, updated_at`).
- Avoid N+1 by not joining; generation reference is not dereferenced here.
- Keep function pure and fast; no additional network calls.

### 9. Implementation Steps
1. Routing
   - Create `src/pages/api/flashcards/[id].ts` with `export const GET` and `export const prerender = false` (per Astro rules).
   - Access Supabase via `Astro.locals` (use `SupabaseClient` type from `src/db/supabase.client.ts`).

2. Validation
   - In `src/lib/validation/flashcard.schemas.ts` (or new file if missing), add:
     - `flashcardIdParamSchema = z.object({ id: z.string().regex(/^\d+$/).transform(Number).refine(n => Number.isSafeInteger(n) && n > 0, 'Invalid id') })`.
   - Validate `Astro.params` with this schema; on error, return 400 with details.

3. Service Layer
   - In `src/lib/services/flashcard.service.ts`, add function:
     - `getFlashcardById({ supabase, id, userId }): Promise<FlashcardDTO | null>`.
     - Query: `supabase.from('flashcards').select('id, front, back, source, generation_id, created_at, updated_at').eq('id', id).eq('user_id', userId).maybeSingle()`.
     - On `error` → throw; on `data` null → return null; else map to `FlashcardDTO`.

4. Endpoint Handler
   - Extract `user` from `locals.supabase.auth.getUser()` (or equivalent helper in `src/lib/utils/auth-helpers.ts`). If missing → 401 using `auth-errors`.
   - Parse and validate `id` using the Zod schema. If invalid → 400.
   - Call `getFlashcardById` with `user.id` and `id`.
   - If `null` → 404 using `api-errors.notFound('Flashcard not found')`.
   - Else return `new Response(JSON.stringify(dto), { status: 200, headers: { 'Content-Type': 'application/json' } })`.

5. Utilities and Types
   - Ensure imports for `zod`, `api-errors`, `auth-errors`, `SupabaseClient`, and DTO typings from `src/types.ts`.

6. Tests
   - Unit tests (Vitest):
     - Validation: invalid ids (non-numeric, zero, negative, too large) → 400.
     - Auth: unauthenticated → 401.
     - Service: not found → 404; found → 200 with correct shape.
   - E2E (Playwright):
     - Authenticated request to existing flashcard returns 200 + DTO.
     - Request to non-owned flashcard returns 404.

7. Docs
   - Add endpoint description to README or API docs if applicable.

### 10. Alignment With Tech Stack and Rules
- **Tech Stack**: See `.ai/tech-stack.md`.
- **Backend Rules**: Follow Cursor rules: `shared`, `backend`, `astro`.
  - Use Zod for input validation.
  - Use Supabase from `Astro.locals` and `SupabaseClient` from `src/db/supabase.client.ts`.
  - Set `export const prerender = false` for API routes.
  - Extract business logic into `src/lib/services`.


