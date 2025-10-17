# API Endpoint Implementation Plan: POST /api/generations

## 1. Endpoint Overview

This endpoint generates flashcard proposals from user-provided source text using a mocked AI service. Proposals are returned to the client for review but are not saved as flashcards until the user explicitly accepts them via POST /api/flashcards.

**Key Features:**
- AI-powered flashcard generation from text (1000-10000 characters)
- Performance tracking (API response duration)
- Error logging for failed AI requests
- User-specific data isolation via RLS

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/generations`
- **Authentication:** Required (Supabase Auth)
- **Content-Type:** `application/json`

### Parameters

**Required:**
- `source_text` (string): Text content to generate flashcards from
  - Min length: 1000 characters
  - Max length: 10000 characters
  - Validated via Zod schema

**Optional:**
- None (AI model is configured on backend)

### Request Body Structure

```typescript
{
  source_text: string; // 1000-10000 characters
}
```

### Request Body Validation (Zod Schema)

```typescript
const CreateGenerationSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters")
    .trim()
});
```

## 3. Used Types

### Command Models (Input)
- `CreateGenerationCommand` - Request body type

### DTOs (Output)
- `GenerationCreationResponseDTO` - Success response
- `FlashcardProposalDTO` - Individual flashcard proposal
- `ErrorResponseDTO` - Error response

### Database Types
- `Database["public"]["Tables"]["generations"]["Insert"]` - For inserting generation records
- `Database["public"]["Tables"]["generation_error_logs"]["Insert"]` - For error logging

## 4. Response Details

### Success Response (201 Created - New Generation)

```json
{
  "generation_id": 46,
  "proposals": [
    {
      "front": "What is TypeScript?",
      "back": "TypeScript is a strongly typed programming language that builds on JavaScript.",
      "source": "ai-full"
    }
  ]
}
```

**Headers:**
- `Content-Type: application/json`

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error": "Validation Error",
  "message": "Invalid request body",
  "details": [
    {
      "field": "source_text",
      "message": "Source text must be at least 1000 characters"
    }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

**500 Internal Server Error** - Database or server error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
1. Authentication Check (Middleware)
    ↓
2. Request Validation (Zod)
    ↓
3. Calculate SHA256 Hash
    ↓
4. Call Mock AI Service
    ↓
5. Store Generation Record
    ↓
6. Return Proposals (201)
    ↓
7. Error Handler (if any step fails)
    ↓
8. Log Error (generation_error_logs)
```

### Detailed Data Flow

1. **Authentication Layer (Middleware)**
   - Extract user from `context.locals.supabase`
   - Verify `auth.uid()` is present
   - Reject with 401 if unauthenticated

2. **Input Validation**
   - Parse request body with Zod schema
   - Validate text length (1000-10000 chars)
   - Return 400 with field-level errors if invalid

3. **Hash Calculation**
   - Calculate SHA256 hash of `source_text`
   - Use Node.js crypto module: `crypto.createHash('sha256').update(source_text).digest('hex')`

4. **Mock AI Service Call**
   - Call MockAIService.generateFlashcards(source_text)
   - Track start/end time for duration calculation
   - Returns predefined mock flashcard proposals

5. **Store Generation Record**
   - Insert into `generations` table:
     ```typescript
     {
       user_id: userId,
       model: 'mock-ai-model',
       generated_count: proposals.length,
       generated_duration: durationMs,
       source_text_hash: hash,
       source_text_length: source_text.length
     }
     ```

6. **Error Logging** (on failure)
   - Insert into `generation_error_logs`:
     ```typescript
     {
       user_id: userId,
       model: 'mock-ai-model',
       source_text_hash: hash,
       source_text_length: source_text.length,
       error_code: errorCode,
       error_message: errorMessage
     }
     ```

## 6. Security Considerations

### Authentication & Authorization

1. **User Authentication**
   - Enforce via Astro middleware
   - Check `context.locals.supabase.auth.getUser()`
   - Return 401 for unauthenticated requests

2. **Row-Level Security (RLS)**
   - RLS policies ensure users can only:
     - INSERT generations with their own `user_id`
     - SELECT their own generations
   - No additional authorization checks needed at application layer

3. **Input Validation**
   - Strict character limits prevent abuse
   - Text length validation (1000-10000 chars)

### Data Protection

1. **Sensitive Data Handling**
   - Source text is NOT stored in database (only hash)
   - User privacy preserved (no text content retention)
   - Only metadata stored for analytics

### Injection Prevention

1. **SQL Injection**
   - Use Supabase parameterized queries
   - Never concatenate user input in queries

## 7. Error Handling

### Error Scenarios

| Scenario | Status Code | Error Code | Handling Strategy |
|----------|-------------|------------|-------------------|
| Missing authentication | 401 | `AUTHENTICATION_REQUIRED` | Return early, no logging |
| Invalid source_text length | 400 | `VALIDATION_ERROR` | Zod validation, return field errors |
| Database connection error | 500 | `DATABASE_ERROR` | Log error, return generic message |

### Error Logging Strategy

**Log to Application Logs (console):**
- Database errors
- Unexpected exceptions

**Do NOT Log:**
- Validation errors (400)
- Authentication failures (401)

### Error Response Format

All errors follow standard `ErrorResponseDTO`:
```typescript
{
  error: string;        // Human-readable error title
  message: string;      // Detailed error message
  details?: array;      // Field-level validation errors (optional)
  code: ErrorCode;      // Machine-readable error code
  timestamp: string;    // ISO 8601 timestamp
}
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Mock AI Service**
   - Simulated delay to mimic real AI service
   - Fast response (< 100ms)

2. **Database Inserts**
   - Index on `source_text_hash` for future optimizations
   - Standard insert performance

### Response Time Targets
- Total endpoint response: < 500ms

## 9. Implementation Steps

### Step 1: Create Mock AI Service
**File:** `src/lib/services/mock-ai.service.ts`
- Generate mock flashcard proposals (5 predefined cards)
- Simulate 100ms processing delay
- Return proposals with model name and duration

### Step 2: Create Generation Service
**File:** `src/lib/services/generation.service.ts`
- Implement SHA256 hash calculation for source text
- Implement database insert for generation records
- Return generation ID after successful insert

### Step 3: Create Validation Schema
**File:** `src/lib/validation/generation.schemas.ts`
- Define Zod schema for request validation
- Validate source_text length (1000-10000 chars)
- Export TypeScript type from schema

### Step 4: Create API Route Handler
**File:** `src/pages/api/generations/index.ts`
- Check user authentication via middleware
- Validate request body with Zod
- Calculate source text hash
- Call mock AI service
- Store generation record
- Return 201 response with proposals

### Step 5: Update Middleware
**File:** `src/middleware/index.ts`
- Initialize Supabase client
- Attach client to context.locals
- Ensure authentication is available

---

## Implementation Checklist

- [ ] Create `MockAIService` class
- [ ] Create `GenerationService` class
- [ ] Create validation schemas with Zod
- [ ] Implement API route handler (`POST /api/generations`)
- [ ] Configure middleware for authentication

## Notes

1. **Mock Service**: The MockAIService returns predefined flashcard proposals. Replace with real AI service integration when ready.

2. **Future Enhancements**:
   - Implement caching based on source_text_hash
   - Add real AI service integration (OpenRouter/OpenAI)
   - Implement rate limiting for cost control

