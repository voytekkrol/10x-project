## API Endpoint Implementation Plan: PUT /api/flashcards/:id

### 1. Endpoint Overview
Updates the content of a single flashcard owned by the authenticated user. Only the `front` and `back` fields are mutable. Returns the updated flashcard as a DTO, omitting internal fields like `user_id`.

### 2. Request Details
- **HTTP Method**: PUT
- **URL Structure**: `/api/flashcards/:id`
- **Parameters**:
  - **Required**: `id` (path) — positive integer
  - **Optional**: none
- **Request Body**:
  - JSON object with both fields present
  - Shape:
    ```json
    {
      "front": "Updated question",
      "back": "Updated answer"
    }
    ```
  - Constraints:
    - `front`: string, trimmed, length 1–200
    - `back`: string, trimmed, length 1–500

### 3. Used Types
- `FlashcardDTO` (response)
- `UpdateFlashcardCommand = Pick<FlashcardUpdate, "front" | "back">` (request body model)

Validation schemas (Zod):
- Reuse `FlashcardIdParamSchema` for `:id`
- Add `UpdateFlashcardCommandSchema`:
  - `{ front: z.string().trim().min(1).max(200), back: z.string().trim().min(1).max(500) }`

### 4. Response Details
- **200 OK**: Returns `FlashcardDTO` for the updated flashcard
- **400 Bad Request**: Invalid path param or body shape (schema validation errors)
- **401 Unauthorized**: Missing/invalid session
- **404 Not Found**: Flashcard does not exist for this user
- **422 Unprocessable Entity**: Database constraint violations not caught by validation
- **500 Internal Server Error**: Unexpected server issues

### 5. Data Flow
1. Astro route handler `PUT` in `src/pages/api/flashcards/[id].ts`:
   - Read `locals.supabase` and `locals.session`
   - Validate session; if absent, return 401
   - Validate `params.id` with `FlashcardIdParamSchema`; on failure, return 400 with details
   - Parse JSON body and validate with `UpdateFlashcardCommandSchema`; on failure, return 400 with details
2. Call service method `updateFlashcard({ supabase, userId, id, command })` placed in `src/lib/services/flashcard.service.ts`
   - Perform ownership check via `user_id` filter in the update query
   - Update `front`, `back`, and rely on DB trigger/DEFAULT to refresh `updated_at`
   - Use `select("id, front, back, source, generation_id, created_at, updated_at")` with `.single()` after update to return updated row
   - If no matching row, return `null`
3. Route maps result to `FlashcardDTO` (already shaped by select) and returns 200
4. Map failures to appropriate error responses

### 6. Security Considerations
- **Authentication**: Require `locals.session` (Supabase auth). Return 401 otherwise.
- **Authorization/Ownership (IDOR prevention)**: Scope update by both `id` and `user_id = session.user.id`. Never update by `id` alone.
- **Input validation**: Zod schemas enforce types and length bounds before DB.
- **Rate limiting**: If a middleware exists, ensure it applies; otherwise note as future enhancement.
- **Error leakage**: Return standardized `ErrorResponseDTO`; avoid exposing raw DB errors.
- **Method semantics**: Use `PUT` only for full replacement of editable fields (`front`, `back`). Do not accept additional fields.

### 7. Error Handling
Return `ErrorResponseDTO` consistently:
- 400 `VALIDATION_ERROR`: Zod errors for `id` or body. Include `details` per field.
- 401 `AUTHENTICATION_REQUIRED`: No session.
- 404 `RESOURCE_NOT_FOUND`: No flashcard with `id` for this user.
- 422 `DATABASE_ERROR`: Constraint failures surfaced from DB despite validation.
- 500 `INTERNAL_ERROR`: Unhandled exceptions (logged server-side).

Logging:
- Log server-side with contextual info (userId, id) using `console.error` (consistent with current code) in both route and service on unexpected errors.

### 8. Performance Considerations
- Single-row update with selective columns and a single return projection — O(1) operation.
- Use a single update returning the desired columns to avoid an extra fetch.
- Keep payload minimal; trim strings before update to prevent unnecessary DB writes.

### 9. Implementation Steps
1. Validation
   - In `src/lib/validation/flashcard.schemas.ts`, add `UpdateFlashcardCommandSchema`:
     - `{ front: z.string().trim().min(1).max(200), back: z.string().trim().min(1).max(500) }`
     - Export inferred type if needed.
2. Service
   - In `src/lib/services/flashcard.service.ts`, add:
     - `updateFlashcard({ supabase, userId, id, command }: { supabase: SupabaseClient; userId: string; id: number; command: UpdateFlashcardCommand; }): Promise<FlashcardDTO | null>`
     - Implementation:
       - Execute `.from("flashcards").update({ front: command.front.trim(), back: command.back.trim() }).eq("id", id).eq("user_id", userId).select("id, front, back, source, generation_id, created_at, updated_at").single()`
       - On `PostgrestError`, `console.error` and throw a generic error for 500/422 mapping by caller
       - Return `null` if no data
3. Route
   - In `src/pages/api/flashcards/[id].ts`, add `export const PUT: APIRoute = async (...) => { ... }` mirroring GET/DELETE structure:
     - Auth check (401)
     - Path param validation (400)
     - Body parse + validation (400)
     - Call service `updateFlashcard`
     - If `null`, return 404
     - Else 200 with DTO
     - Catch and map unexpected errors to 500; optionally map DB check violations to 422 if detectable
4. Tests
   - Unit tests for validation schema: lengths, trimming, required fields
   - Service tests using MSW/Supabase mock: successful update, not found, DB error
   - API E2E (Playwright/Vitest):
     - 200 on valid update with ownership
     - 400 on invalid `id`/body
     - 401 without session
     - 404 for non-existent/unauthorized record
     - 422/500 surfaces
5. Documentation
   - Update API docs (README or `.ai` plans) to include request/response examples and errors

### References
- Tech stack: see `.ai/tech-stack.md`
- Implementation rules: see shared/backend/Astro rules (Cursor Rules: `shared`, `backend`, `astro`)


