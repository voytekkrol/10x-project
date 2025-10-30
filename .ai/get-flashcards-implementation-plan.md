## API Endpoint Implementation Plan: GET /api/flashcards

### 1. Endpoint Overview
List authenticated user’s flashcards with pagination, optional filtering by `source` and `generation_id`, and sorting. Returns DTOs without internal `user_id` and a pagination object.

### 2. Request Details
- **HTTP Method**: GET
- **URL**: `/api/flashcards`
- **Parameters**:
  - **Required**: none
  - **Optional (Query)**:
    - `page` (number, ≥1, default 1)
    - `limit` (number, 1–100, default 50)
    - `source` (enum: `ai-full` | `ai-edited` | `manual`)
    - `sort` (enum: `asc` | `desc`, default `desc`) — sort by `created_at`
    - `generation_id` (number, >0)
- **Request Body**: none

### 3. Used Types
- `FlashcardDTO` (from `src/types.ts`): `{ id, front, back, source, generation_id, created_at, updated_at }`
- `ListFlashcardsQuery` (from `src/types.ts`): `{ page?, limit?, source?, sort?, generation_id? }`
- `FlashcardListResponseDTO` (from `src/types.ts`): `{ data: FlashcardDTO[], pagination: PaginationDTO }`
- Validation schema (new): `listFlashcardsQuerySchema` (Zod) in `src/lib/validation/flashcard.schemas.ts` (or colocated with existing flashcard validation)

### 4. Response Details
- **200 OK**
  - Body:
    ```json
    {
      "data": [
        { "id": 123, "front": "...", "back": "...", "source": "manual", "generation_id": null, "created_at": "...", "updated_at": "..." }
      ],
      "pagination": { "page": 1, "limit": 50, "total": 150, "total_pages": 3 }
    }
    ```
- **400 Bad Request**: invalid query params
- **401 Unauthorized**: no active session/user
- **500 Internal Server Error**: unhandled/DB errors

### 5. Data Flow
1. Client sends GET `/api/flashcards` with optional query params.
2. Astro API route (`src/pages/api/flashcards/index.ts`) reads Supabase client from `Astro.locals` and validates query with Zod.
3. Service layer (`src/lib/services/flashcard.service.ts`) performs the database query using Supabase:
   - Base filter: `user_id = currentUserId`
   - Optional filters: `source`, `generation_id`
   - Sorting: `created_at` per `sort`
   - Pagination: `range` with `(page-1)*limit .. page*limit-1`
   - Separate count: use `select(..., { count: 'exact', head: true })` or a dedicated count query with identical filters
4. Map rows to `FlashcardDTO[]` (omit `user_id`).
5. Compose `pagination` using `page`, `limit`, `total`, `total_pages = Math.max(1, Math.ceil(total/limit))`.
6. Return 200 with DTO; handle and map errors.

### 6. Security Considerations
- **Authentication**: Require authenticated user via Supabase session from `Astro.locals`. Return 401 if absent.
- **Authorization**: Enforce `user_id = currentUserId` both in query and rely on Supabase RLS policies; never accept `user_id` from client.
- **Input Validation**: Zod schema enforces numeric ranges and enums; reject invalid inputs with 400.
- **Data Exposure**: Return only `FlashcardDTO` (no `user_id` or internal fields).
- **Abuse Prevention**: Cap `limit` at 100; sane defaults to prevent large responses.
- **Query Safety**: Use Supabase query builder; avoid string interpolation.

### 7. Error Handling
- Validation errors → 400 with problem details `{ error: 'InvalidQuery', details: zodIssues }`.
- Auth missing → 401 `{ error: 'Unauthorized' }`.
- DB errors/unexpected → 500 `{ error: 'InternalServerError' }`.
- Use helpers in `src/lib/utils/api-errors.ts` and consistent error mapping (include a request correlation id if available).
- Optional: log server-side errors using a structured logger; if an error table/event pipeline exists, record `{ user_id, route, query, error_code, message }` without storing PII-rich content.

### 8. Performance Considerations
- Index usage: ensure indexes on `(user_id, created_at desc)`, `(user_id, source)`, `(user_id, generation_id)` (migrations appear to include indexes; verify).
- Pagination: offset-based with `range` is acceptable for typical list sizes; consider keyset pagination by `created_at, id` if needed later.
- Select only required columns for DTO.
- Avoid N+1: this endpoint reads from a single table.
- Use `head: true` count for exact total; if performance degrades, provide `total: null` or a cached/approximate count as a feature flag.

### 9. Implementation Steps
1. Validation
   - Add `listFlashcardsQuerySchema` in `src/lib/validation/flashcard.schemas.ts` (or extend existing file):
     - `page`: number().int().min(1).default(1)
     - `limit`: number().int().min(1).max(100).default(50)
     - `source`: enum(['ai-full','ai-edited','manual']).optional()
     - `sort`: enum(['asc','desc']).default('desc')
     - `generation_id`: number().int().positive().optional()
   - Export `infer` type to align with `ListFlashcardsQuery`.
2. Service Layer (`src/lib/services/flashcard.service.ts`)
   - Add `listFlashcards(params: { supabase: SupabaseClient; userId: string; query: ListFlashcardsQuery }): Promise<{ rows: FlashcardDTO[]; total: number }>`
   - Build base query with `.from('flashcards').select('id, front, back, source, generation_id, created_at, updated_at', { count: 'exact' })` and filters:
     - `.eq('user_id', userId)`
     - conditional `.eq('source', source)` and `.eq('generation_id', generation_id)`
     - `.order('created_at', { ascending: sort === 'asc' })`
     - `.range(offset, offset + limit - 1)`
   - Handle errors from Supabase; return typed result.
3. API Route (`src/pages/api/flashcards/index.ts`)
   - `export const prerender = false`
   - GET handler:
     - Read `supabase` and `user` from `Astro.locals` (using helpers in `src/lib/utils/auth-helpers.ts` if available) and 401 if missing.
     - Parse and validate query via `listFlashcardsQuerySchema` (`safeParse`); 400 on failure.
     - Call service; compute `pagination` and return 200 with `FlashcardListResponseDTO`.
     - Map and format errors via `api-errors` utilities; 500 on unhandled.
4. Types
   - Ensure `FlashcardDTO`, `ListFlashcardsQuery`, and `FlashcardListResponseDTO` in `src/types.ts` match usage; avoid importing Supabase JS types directly except our wrapped `SupabaseClient` from `src/db/supabase.client.ts`.
5. Tests
   - Unit: service query composition and mapping using MSW (`tests/unit/...`).
   - API: handler validation and responses (mock `Astro.locals` + Supabase client).
   - E2E: extend `tests/e2e/generate.spec.ts` or add new spec to assert listing visible for authenticated user, pagination, filters.
6. Docs
   - Add brief README snippet for query params and defaults.

### References
- Tech stack: see `.ai/tech-stack.md`
- Rules: shared/backend/astro guidelines (validation with Zod, use Supabase from `Astro.locals`, DTO mapping, SSR API routes)


