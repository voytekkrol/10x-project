## API Endpoint Implementation Plan: DELETE /api/flashcards/:id

### 1. Endpoint Overview
Permanently delete a single flashcard owned by the authenticated user. The endpoint validates the path parameter, enforces authentication and ownership, performs a single-row delete, and returns 204 No Content on success.

### 2. Request Details
- **HTTP Method**: DELETE
- **URL Structure**: `/api/flashcards/:id`
- **Parameters**:
  - **Required**: `id` (path param, positive integer)
  - **Optional**: none
- **Request Body**: none

### 3. Used Types
- From `src/types.ts`:
  - `ErrorResponseDTO`
  - `ErrorCode` (for `ErrorResponseDTO.code`)
- From `src/lib/validation/flashcard.schemas.ts`:
  - `FlashcardIdParamSchema` (Zod) for `:id`

Command/DTO models: No request/response body for DELETE.

### 4. Response Details
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid `id` path parameter
- **401 Unauthorized**: Missing/invalid authentication
- **404 Not Found**: Flashcard with given `id` not found for this user
- **500 Internal Server Error**: Unexpected server/database error

Response body is empty for 204. For error statuses, return `ErrorResponseDTO` with `Content-Type: application/json`.

### 5. Data Flow
1. Astro receives `DELETE /api/flashcards/:id`.
2. Retrieve `supabase` and `session` from `locals` (middleware-injected).
3. Validate and coerce `params.id` using `FlashcardIdParamSchema`.
4. Extract `userId` from `session`.
5. Call service to delete the flashcard with filters `id = :id AND user_id = :userId`:
   - If no row deleted → return 404.
   - If delete succeeds → return 204.
6. On errors, log and return appropriate `ErrorResponseDTO` with status code.

### 6. Security Considerations
- **Authentication**: Require `session` in `locals`; otherwise 401.
- **Authorization/Ownership**: Delete statement must include `user_id = session.user.id` to prevent IDOR.
- **Input Validation**: Use Zod schema (`FlashcardIdParamSchema`) to validate/coerce `id` to a safe positive integer; otherwise 400.
- **Least Privilege**: Only operate on the specific resource, return minimal metadata.
- **Error Leakage**: Use generic messages for 500; avoid leaking internal DB details.
- **RLS** (if enabled later): Keep explicit ownership filter even if RLS policies exist.

### 7. Error Handling
- Use the standard `ErrorResponseDTO` structure and codes:
  - 400: `VALIDATION_ERROR` (message: "Invalid path parameter")
  - 401: `AUTHENTICATION_REQUIRED` (message: "Authentication required")
  - 404: `RESOURCE_NOT_FOUND` (message: "Flashcard not found")
  - 500: `INTERNAL_ERROR` (message: "An unexpected error occurred")
- Log server-side errors with context (`console.error`) including the id and userId where safe.

### 8. Performance Considerations
- Single-row delete by primary key and user scope is O(1) and index-backed.
- No response body → minimal payload.
- No need for transactions or additional round-trips.

### 9. Implementation Steps
1. Service: add delete function
   - File: `src/lib/services/flashcard.service.ts`
   - Add:
     - `export async function deleteFlashcard(params: { supabase: SupabaseClient; userId: string; id: number; }): Promise<boolean>`
     - Implementation:
       - `const { error, count } = await supabase.from("flashcards").delete({ count: "exact" }).eq("id", id).eq("user_id", userId);`
       - If `error` → log and throw `new Error("Failed to delete flashcard")`.
       - Return `count !== null && count > 0` to indicate deletion.
   - Follow existing patterns from `getFlashcardById` for logging and error throwing style.

2. API route: implement DELETE handler
   - File: `src/pages/api/flashcards/[id].ts`
   - Add `export const DELETE: APIRoute = async ({ locals, params }) => { ... }` alongside the existing `GET`.
   - Steps inside handler:
     - Set `export const prerender = false` (already present).
     - Extract `supabase` and `session` from `locals` and validate; if missing → 401 with `ErrorResponseDTO`.
     - Validate `params.id` via `FlashcardIdParamSchema.safeParse({ id: params.id })`; if invalid → 400 with details.
     - Extract `userId = session.user.id`.
     - Call `deleteFlashcard({ supabase, userId, id })`.
       - If result is `false` → 404 with `ErrorResponseDTO`.
       - If `true` → return `new Response(null, { status: 204 })`.
     - Catch unexpected errors → log and return 500 with `ErrorResponseDTO`.
   - Headers: error responses should include `Content-Type: application/json`.

3. Tests (outline)
   - Unit tests for service `deleteFlashcard` (mock Supabase client):
     - Deletes matching row returns true.
     - No matching row returns false.
     - DB error throws.
   - API tests (Playwright or Vitest integration):
     - 401 when unauthenticated.
     - 400 for invalid id (e.g., `abc`, `0`, negative, overflow).
     - 404 when id not found for user.
     - 204 when deletion succeeds.

4. Docs
   - Ensure README or API docs reference the endpoint behavior and status codes.

### 10. Tech Stack and Rules Alignment
- Uses Astro server endpoints with `export const prerender = false`.
- Validates inputs with Zod (`FlashcardIdParamSchema`).
- Uses Supabase via `locals.supabase` per backend rules; types from `src/db/supabase.client.ts`.
- Error handling returns `ErrorResponseDTO` and logs server-side errors.
- No response body for 204; correct status codes per specification.


