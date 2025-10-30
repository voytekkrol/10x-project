# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Endpoint Overview

This endpoint creates flashcards supporting both manual entry and AI-generated acceptance. When accepting AI-generated flashcards, it updates acceptance statistics on the generation record for tracking AI quality metrics (75% acceptance rate target per PRD).

**Key Features:**
- Batch creation support (array of flashcards)
- Automatic acceptance count tracking for AI-generated flashcards
- No authentication required (development mode with static user_id)
- Generation ownership validation (same static user)

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/flashcards`
- **Authentication:** None (uses static user_id for development)
- **Content-Type:** `application/json`

### Parameters

**Request Body Structure:**
```typescript
{
  flashcards: [
    {
      front: string;        // 1-200 characters
      back: string;         // 1-500 characters  
      source: "manual" | "ai-full" | "ai-edited";
      generation_id: number | null;
    }
  ]
}
```

**Validation Rules:**
- Array: minimum 1 flashcard required
- `front`: 1-200 characters (trimmed)
- `back`: 1-500 characters (trimmed)
- If `source` is `"ai-full"` or `"ai-edited"`: `generation_id` required
- If `source` is `"manual"`: `generation_id` must be null
- All AI flashcards in batch must reference same `generation_id`

### Request Body Validation (Zod Schema)

```typescript
const FlashcardCreateDtoSchema = z.object({
  front: z.string().trim().min(1).max(200),
  back: z.string().trim().min(1).max(500),
  source: z.enum(["manual", "ai-full", "ai-edited"]),
  generation_id: z.number().int().positive().nullable(),
}).refine(/* Conditional validation: generation_id required for AI, null for manual */);

const CreateFlashcardsCommandSchema = z.object({
  flashcards: z.array(FlashcardCreateDtoSchema).min(1)
    .refine(/* All AI flashcards must have same generation_id */),
});
```

## 3. Used Types

### Command Models (Input)
- `CreateFlashcardsCommand` - Request body wrapper
- `FlashcardCreateDto` - Individual flashcard data

### DTOs (Output)
- `FlashcardDTO[]` - Array of created flashcards (success response)
- `ErrorResponseDTO` - Standard error format

### Database Types
- `Database["public"]["Tables"]["flashcards"]["Insert"]` - For inserting flashcards
- `Database["public"]["Tables"]["generations"]["Row"]` - For generation validation and updates

## 4. Response Details

### Success Response (201 Created)

```json
[
  {
    "id": 123,
    "front": "What is TypeScript?",
    "back": "TypeScript is a strongly typed programming language...",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-10-17T12:00:00.000Z",
    "updated_at": "2025-10-17T12:00:00.000Z"
  }
]
```

**Headers:**
- `Content-Type: application/json`

### Error Responses

**400 Bad Request** - Validation error
```json
{
  "error": "Validation Error",
  "message": "Invalid request body",
  "details": [{ "field": "flashcards.0.front", "message": "..." }],
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-10-17T12:00:00.000Z"
}
```

**404 Not Found** - Generation not found
**500 Internal Server Error** - Database or server error

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
1. Request Validation (Zod)
    ↓
2. Validate Generation Exists (if AI-generated)
    ↓
3. Insert Flashcards (with static user_id: null)
    ↓
4. Update Acceptance Counts (for AI flashcards)
    ↓
5. Return Created Flashcards (201)
```

### Detailed Data Flow

1. **Input Validation**
   - Parse request body with Zod schema
   - Validate flashcard array (minimum 1) and field constraints
   - Return 400 with field-level errors if invalid

2. **Generation Validation** (for AI flashcards only)
   - Query generation by id to verify it exists
   - Return 404 if generation not found

3. **Insert Flashcards**
   - Batch insert flashcards with user_id: null (development mode)
   - Use `supabaseClient` directly (no authentication)

4. **Update Acceptance Counts** (for AI flashcards only)
   - Direct UPDATE query with COALESCE for atomic increment
   - Counts `ai-full` → `accepted_unedited_count`, `ai-edited` → `accepted_edited_count`

5. **Response Formatting**
   - Map to FlashcardDTO array (omit user_id)
   - Return 201 with created flashcards

## 6. Security Considerations

### Development Mode (No Authentication)

1. **Static User ID**
   - Using `user_id: null` for all flashcards (development mode)
   - RLS policies disabled or bypassed via service role
   - Authentication will be added in production

2. **Generation Validation**
   - Verify generation_id exists before creating flashcards
   - Return 404 if generation not found

### Input Validation

1. **Character Limits**
   - Front: 200 characters, Back: 500 characters
   - Zod validation prevents database constraint violations

2. **Array Validation**
   - Minimum 1 flashcard required
   - Zod validation ensures proper request structure

### Injection Prevention

1. **SQL Injection**
   - Use Supabase parameterized queries
   - Never concatenate user input in queries

## 7. Error Handling

### Error Scenarios

| Scenario | Status Code | Error Code | Handling Strategy |
|----------|-------------|------------|-------------------|
| Invalid flashcard data | 400 | `VALIDATION_ERROR` | Zod validation with field errors |
| generation_id not found | 404 | `RESOURCE_NOT_FOUND` | Database query validation |
| Database error | 500 | `DATABASE_ERROR` | Log and return generic message |

### Error Logging Strategy

**Log to Application Logs (console):**
- Database errors
- Unexpected exceptions

**Do NOT Log:**
- Validation errors (400)

### Error Response Format

All errors follow standard `ErrorResponseDTO`:
```typescript
{
  error: string;
  message: string;
  details?: array;      // Field-level validation errors (optional)
  code: ErrorCode;
  timestamp: string;
}
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Operations**
   - Batch insert for multiple flashcards (single roundtrip)
   - Direct UPDATE query for acceptance count increment

2. **Generation Validation Query**
   - Indexed lookup on primary key (fast)

### Response Time Targets
- Total endpoint response: < 500ms (varies with batch size)

## 9. Implementation Steps

### Step 1: Create Flashcard Service
**File:** `src/lib/services/flashcard.service.ts`
- Implement `createFlashcards()` - batch insert flashcards with user_id: null
- Implement `validateGenerationExists()` - verify generation exists
- Implement `updateAcceptanceCounts()` - direct UPDATE query with COALESCE
- Use `supabaseClient` imported from `src/db/supabase.client.ts`
- Return FlashcardRow[] from creation

### Step 2: Create Validation Schema
**File:** `src/lib/validation/flashcard.schemas.ts`
- Define `FlashcardCreateDtoSchema` with conditional generation_id validation
- Define `CreateFlashcardsCommandSchema` with array constraint (min 1)
- Add refinement to ensure all AI flashcards reference same generation_id
- Export TypeScript type from schema

### Step 3: Create API Route Handler
**File:** `src/pages/api/flashcards/index.ts`
- Validate request body with Zod
- Validate generation exists for AI flashcards
- Create flashcards via service (user_id: null)
- Update acceptance counts for AI flashcards
- Return 201 response with FlashcardDTO array
- Use `supabaseClient` directly (no authentication)

---

## Implementation Checklist

- [ ] Create `flashcard.service.ts` with helper functions
- [ ] Create `flashcard.schemas.ts` with Zod validation
- [ ] Implement API route handler (`POST /api/flashcards`)
- [ ] Test validation and generation existence checks

## Notes

1. **Development Mode**: Using `user_id: null` for all flashcards. Authentication will be added later when user management is implemented.

2. **Batch Creation**: Supports array of flashcards for better UX when accepting multiple AI proposals.

3. **Acceptance Counts**: Direct UPDATE query with COALESCE for atomic increments.

4. **Future Enhancements**:
   - Add user authentication with Supabase Auth
   - Enable RLS policies for multi-user support
   - Add rate limiting for flashcard creation
   - Implement bulk delete/update operations

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-17  
**Status:** Ready for implementation

