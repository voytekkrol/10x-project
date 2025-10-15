# REST API Plan - 10x-cards

> **Note:** This document defines API endpoints and contracts. For validation rules and database constraints, see `db-plan.md`. For business requirements, see `prd.md`. For technology details, see `tech-stack.md`.

---

## 1. Resources

| Resource | Endpoint Base | Description |
|----------|--------------|-------------|
| Flashcards | `/api/flashcards` | CRUD operations for flashcards |
| Generations | `/api/generations` | AI generation sessions and statistics |
| Error Logs | `/api/generation-error-logs` | AI generation error logs (read-only for users) |

**Authentication:** All endpoints require JWT token via Supabase Auth: `Authorization: Bearer {jwt_token}`

---

## 2. Endpoints

### 2.1 Flashcards

#### GET /api/flashcards
List user's flashcards with pagination.

**Query Parameters:** `page`, `limit`, `source`, `sort`, `generation_id`

**Response (200):**
```json
{
  "data": [{ "id": 123, "front": "...", "back": "...", "source": "manual", "generation_id": null, "created_at": "...", "updated_at": "..." }],
  "pagination": { "page": 1, "limit": 50, "total": 150, "total_pages": 3 }
}
```

---

#### GET /api/flashcards/:id
Get single flashcard by ID.

**Response (200):** Single flashcard object

**Errors:** `401`, `404`, `400`

---

#### POST /api/flashcards
Create flashcard (manual or AI-generated acceptance).

**Request Body:**
```json
{
  "front": "Question text (1-200 chars)",
  "back": "Answer text (1-500 chars)",
  "source": "manual|ai-full|ai-edited",
  "generation_id": null
}
```

**Validation:**
- If `source` is `ai-full` or `ai-edited`: `generation_id` required
- If `source` is `manual`: `generation_id` must be null
- See `db-plan.md` for field constraints

**Business Logic:**
- Increments `accepted_unedited_count` for `ai-full`
- Increments `accepted_edited_count` for `ai-edited`

**Response (201):** Created flashcard object

**Errors:** `401`, `400`, `404`, `422`

---

#### PUT /api/flashcards/:id
Update flashcard front/back.

**Request Body:**
```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

**Response (200):** Updated flashcard object

**Errors:** `401`, `404`, `400`, `422`

---

#### DELETE /api/flashcards/:id
Delete flashcard permanently.

**Response (204):** No content

**Errors:** `401`, `404`, `400`

---

### 2.2 Generations

#### POST /api/generations
Generate flashcard proposals from source text.

**Request Body:**
```json
{
  "source_text": "Text content (1000-10000 chars)"
}
```

**Note:** AI model is configured on backend, not specified by client.

**Business Logic:**
- Calculates SHA256 hash of source_text
- Returns cached result if hash exists and created within 24 hours
- Calls AI API and stores generation record
- Logs duration and returns proposals (not saved as flashcards yet)
- On error, logs to `generation_error_logs`

**Response (201 - New generation):**
```json
{
  "id": 46,
  "user_id": "...",
  "model": "openai/gpt-4o-mini",
  "generated_count": 5,
  "generated_duration": 1250,
  "source_text_hash": "...",
  "source_text_length": 2500,
  "created_at": "...",
  "proposals": [
    { "front": "Question?", "back": "Answer." }
  ]
}
```

**Response (200 - Cached):** Same as above with `"cached": true`

**Errors:** `401`, `400`, `503`, `429`

---

#### GET /api/generations
List user's generation sessions.

**Query Parameters:** `page`, `limit`, `sort`

**Response (200):** Paginated list of generation objects

---

#### GET /api/generations/:id
Get generation details including accepted flashcards.

**Response (200):** Generation object with `flashcards` array

**Errors:** `401`, `404`

---

### 2.3 Generation Error Logs

#### GET /api/generation-error-logs
List AI generation errors for debugging.

**Query Parameters:** `page`, `limit`, `model`, `error_code`, `from_date`, `to_date`, `sort`

**Response (200):** Paginated list of error log objects

**Errors:** `401`, `400`

---

## 3. Authentication & Authorization

**Authentication:** Supabase Auth with JWT tokens
- Access tokens expire after 1 hour
- Refresh tokens valid for 7 days
- Client SDK handles token refresh automatically

**Authorization:** PostgreSQL RLS policies (see `db-plan.md`)
- Users can only access their own data
- Service role bypasses RLS for admin operations

**Security Headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 4. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/generations | 10 | 1 hour |
| POST /api/flashcards | 100 | 1 hour |
| PUT /api/flashcards/:id | 200 | 1 hour |
| DELETE /api/flashcards/:id | 200 | 1 hour |
| GET /api/flashcards | 300 | 1 hour |
| Other GET endpoints | 500 | 1 hour |

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1697368800
```

**Error (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit for this endpoint",
  "retry_after": 3600
}
```

---

## 5. Error Response Format

All errors follow consistent format:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": [{ "field": "field_name", "message": "Specific error" }],
  "code": "ERROR_CODE",
  "timestamp": "2025-10-15T12:00:00Z"
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - Missing/invalid JWT
- `AUTHORIZATION_FAILED` - No permission
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_ERROR` - AI generation failure
- `DATABASE_ERROR` - Constraint violation
- `INTERNAL_ERROR` - Server error

---

## 6. Pagination Standards

**Query Parameters:** `page` (default: 1), `limit` (max varies by endpoint)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Link Headers (RFC 5988):**
```
Link: <https://api.example.com/api/flashcards?page=2&limit=50>; rel="next"
```

---

## 7. Additional Details

**API Version:** v1 (implicit in `/api/` prefix)

**CORS:** 
- Production: `https://10x-cards.com`
- Development: `http://localhost:4321`

**Filtering & Sorting:**
- Filtering: Exact match on specific fields
- Sorting: Timestamp fields (asc/desc)
- Full-text search: Not in MVP

**Monitoring:**
- Track acceptance rate (target: 75%)
- Track AI vs manual ratio (target: 75% AI)
- Log all requests with user_id, status, duration
- Monitor AI API response times

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-15  
**Status:** Ready for implementation
