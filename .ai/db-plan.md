# Database Schema - 10x-cards

## 1. Tables with Columns, Data Types, and Constraints

### 1.1 users

This table is managed by Supabase Auth.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| encrypted_password | VARCHAR(255) | NOT NULL | Encrypted user password |
| confirmed_at | TIMESTAMP WITH TIME ZONE | NULL | Email confirmation timestamp |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Account creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last account update timestamp |
| last_login | TIMESTAMP WITH TIME ZONE | NULL | Last successful login timestamp |

**Table Constraints:**
- `CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')` - Email format validation

**Notes:**
- `confirmed_at` supports email verification flows

---

### 1.2 flashcards

Stores flashcard content with source tracking and ownership.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique flashcard identifier |
| user_id | UUID | NULLABLE, REFERENCES users(id) ON DELETE CASCADE | Owner of the flashcard |
| front | VARCHAR(200) | NOT NULL | Question/front side of flashcard |
| back | VARCHAR(500) | NOT NULL | Answer/back side of flashcard |
| source | VARCHAR(20) | NOT NULL, DEFAULT 'manual' | Origin of flashcard |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Flashcard creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update timestamp |
| generation_id | BIGSERIAL | REFERENCES generations(id) ON DELETE SET NULL | Generation session identifier |

**Table Constraints:**
- `CHECK (LENGTH(front) >= 1 AND LENGTH(front) <= 200)` - Front field character limit
- `CHECK (LENGTH(back) >= 1 AND LENGTH(back) <= 500)` - Back field character limit
- `CHECK (source IN ('ai-full', 'ai-edited', 'manual'))` - Source value validation

**Notes:**
- Character limits prevent abuse and ensure UI consistency
- Source tracking enables analytics on AI vs manual flashcard creation
- `user_id` is nullable to support orphaned flashcards after user deletion
- `generation_id` links flashcard to its AI generation session for tracking and analytics

---

### 1.3 generations

Tracks AI flashcard generation sessions with acceptance statistics.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique generation session identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE SET NULL | User who initiated generation |
| model | VARCHAR(100) | NOT NULL | AI model identifier used for generation |
| generated_count | INTEGER | NOT NULL, DEFAULT 0 | Total flashcards generated in session |
| generated_duration | INTEGER | NOT NULL, DEFAULT 0 | Duration of generation |
| accepted_unedited_count | INTEGER | NULLABLE | Flashcards accepted without modifications |
| accepted_edited_count | INTEGER | NULLABLE | Flashcards accepted after editing |
| source_text_hash | VARCHAR(64) | NOT NULL | SHA256 hash of source text |
| source_text_length | INTEGER | NOT NULL | Character count of source text |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Generation session timestamp |

**Table Constraints:**
- `CHECK (generated_count >= 0)` - Non-negative counter validation
- `CHECK (generated_duration >= 0)` - Non-negative duration validation
- `CHECK (accepted_unedited_count IS NULL OR accepted_unedited_count >= 0)` - Non-negative counter validation (nullable)
- `CHECK (accepted_edited_count IS NULL OR accepted_edited_count >= 0)` - Non-negative counter validation (nullable)
- `CHECK ((accepted_unedited_count IS NULL AND accepted_edited_count IS NULL) OR (accepted_unedited_count + accepted_edited_count <= generated_count))` - Logical acceptance validation
- `CHECK (source_text_length >= 1000 AND source_text_length <= 10000)` - Text length per PRD requirements
- `CHECK (source_text_hash ~ '^[a-f0-9]{64}$')` - SHA256 hash format validation

**Notes:**
- `user_id` uses ON DELETE SET NULL to preserve statistics when users are deleted
- SHA256 hash prevents duplicate processing of identical texts
- Counter fields use INTEGER for future scalability beyond SMALLINT limits
- `generated_duration` stores the API response time in milliseconds for performance monitoring
- Acceptance counts are nullable as they're updated after user reviews flashcards

---

### 1.4 generation_error_logs

Logs AI generation failures for debugging and monitoring.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique error log identifier |
| user_id | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL | User who experienced the error (nullable) |
| model | VARCHAR(100) | NOT NULL | AI model that failed |
| source_text_hash | VARCHAR(64) | NOT NULL | SHA256 hash of source text |
| source_text_length | INTEGER | NOT NULL | Character count of source text |
| error_code | VARCHAR(50) | NULL | Error code from API response |
| error_message | TEXT | NULL | Detailed error message |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Error occurrence timestamp |

**Table Constraints:**
- `CHECK (source_text_hash ~ '^[a-f0-9]{64}$')` - SHA256 hash format validation
- `CHECK (source_text_length > 0)` - Positive text length validation

**Notes:**
- Nullable `user_id` allows logging errors even if user context is lost
- `error_code` and `error_message` support various API error formats
- Helps identify patterns in generation failures

---

## 2. Relationships Between Tables

### Primary Relationships

```
users (1) ──────< (many) flashcards
  │                         ↑
  └──────< (many) generations (1)
  │
  └──────< (many) generation_error_logs
```

### Detailed Relationship Specifications

1. **users → flashcards** (One-to-Many)
   - Foreign Key: `flashcards.user_id` → `users.id`
   - ON DELETE: CASCADE
   - Rationale: User deletion cascades to remove associated flashcards

2. **users → generations** (One-to-Many)
   - Foreign Key: `generations.user_id` → `users.id`
   - ON DELETE: SET NULL
   - Rationale: Preserve generation statistics even after user deletion for analytics

3. **users → generation_error_logs** (One-to-Many)
   - Foreign Key: `generation_error_logs.user_id` → `users.id`
   - ON DELETE: SET NULL
   - Rationale: Maintain error logs for system monitoring even after user deletion

4. **generations → flashcards** (One-to-Many)
   - Foreign Key: `flashcards.generation_id` → `generations.id`
   - ON DELETE: SET NULL
   - Rationale: Links flashcards to their generation session; preserves flashcards when generation record is deleted

**Important Notes:**
- Direct relationship between `flashcards` and `generations` via `generation_id` foreign key
- `user_id` in flashcards is nullable to support orphaned flashcards after user deletion
- No sharing capabilities between users (strict data isolation)

---

## 3. Indexes

### Performance Optimization Strategy

Indexes are designed to optimize:
- User-specific queries (most common access pattern)
- Statistics aggregation
- Deduplication checks
- Generation session lookups

### Index Specifications

#### 3.1 flashcards table indexes

```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX flashcards_pkey ON flashcards(id);

-- User ownership queries (most frequent access pattern)
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Composite index for user flashcards with source filtering
CREATE INDEX idx_flashcards_user_source ON flashcards(user_id, source);

-- Timestamp-based queries for recent flashcards
CREATE INDEX idx_flashcards_created_at ON flashcards(created_at DESC);

-- Generation session queries
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
```

#### 3.2 generations table indexes

```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX generations_pkey ON generations(id);

-- User statistics queries
CREATE INDEX idx_generations_user_id ON generations(user_id);

-- Deduplication checks
CREATE INDEX idx_generations_text_hash ON generations(source_text_hash);

-- Composite index for user-specific generation history
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);

-- Model performance analysis
CREATE INDEX idx_generations_model ON generations(model, created_at DESC);
```

#### 3.3 generation_error_logs table indexes

```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX generation_error_logs_pkey ON generation_error_logs(id);

-- Error analysis by user
CREATE INDEX idx_error_logs_user_id ON generation_error_logs(user_id);

-- Error pattern analysis
CREATE INDEX idx_error_logs_error_code ON generation_error_logs(error_code, created_at DESC);

-- Model-specific error tracking
CREATE INDEX idx_error_logs_model ON generation_error_logs(model, created_at DESC);

-- Time-based error monitoring
CREATE INDEX idx_error_logs_created_at ON generation_error_logs(created_at DESC);
```

#### 3.4 users table indexes

```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX users_pkey ON users(id);

-- Email uniqueness and login queries (automatic via UNIQUE constraint)
CREATE UNIQUE INDEX users_email_unique ON users(email);

-- Active users queries
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Last login tracking for user engagement analytics
CREATE INDEX idx_users_last_login ON users(last_login DESC);
```

**Indexing Strategy Notes:**
- Composite indexes support common query patterns identified in PRD user stories
- Descending timestamp indexes optimize "recent items" queries
- Hash-based indexes enable efficient deduplication
- Generation session index enables efficient flashcard-to-generation lookups

---

## 4. PostgreSQL Row-Level Security (RLS) Policies

### Security Architecture

RLS policies ensure strict data isolation between users, implementing the security requirement from US-009: "Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki."

### 4.1 Enable RLS on Tables

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

### 4.2 flashcards RLS Policies

```sql
-- Users can view only their own flashcards
CREATE POLICY "Users can view their own flashcards"
ON flashcards
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Users can insert flashcards for themselves only
CREATE POLICY "Users can create their own flashcards"
ON flashcards
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Users can update only their own flashcards
CREATE POLICY "Users can update their own flashcards"
ON flashcards
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Users can delete only their own flashcards
CREATE POLICY "Users can delete their own flashcards"
ON flashcards
FOR DELETE
USING (
  auth.uid() = user_id
);
```

### 4.3 generations RLS Policies

```sql
-- Users can view only their own generation statistics
CREATE POLICY "Users can view their own generations"
ON generations
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Users can create generation records for themselves only
CREATE POLICY "Users can create their own generations"
ON generations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- No UPDATE policy - generation records are immutable after creation
-- No DELETE policy - generation records preserved for statistics
```

### 4.4 generation_error_logs RLS Policies

```sql
-- Users can view only their own error logs
CREATE POLICY "Users can view their own error logs"
ON generation_error_logs
FOR SELECT
USING (
  auth.uid() = user_id
);

-- System/application can create error logs (no user restriction on INSERT)
CREATE POLICY "System can create error logs"
ON generation_error_logs
FOR INSERT
WITH CHECK (true);

-- No UPDATE or DELETE policies - error logs are immutable
```

### 4.5 Service Role Bypass

```sql
-- Service role (backend) can bypass RLS for administrative operations
-- This is configured at the Supabase project level, not via policies
-- Service role can perform:
--   - GDPR compliance operations (user data deletion via Supabase Auth)
--   - Statistics aggregation across all users
--   - System maintenance and data migration
--   - Administrative queries and bulk operations
```

**RLS Policy Notes:**
- All policies assume Supabase authentication with `auth.uid()` function
- Users managed by Supabase Auth; RLS ensures data isolation between users
- Generation and error log records are immutable (no update/delete policies)
- Service role has unrestricted access for administrative operations

---

## 5. Design Decisions and Additional Notes

### 5.1 GDPR Compliance Strategy

**User Management via Supabase Auth:**
- Users table managed by Supabase Auth system
- User deletion handled through Supabase Auth APIs
- No soft delete mechanism; relies on Supabase's user management

**User Deletion Cascade:**
- `flashcards`: CASCADE deletion removes user's flashcards permanently
- `flashcards.user_id`: Nullable to handle orphaned flashcards (if needed)
- `generations`: SET NULL preserves aggregate statistics without user association
- `generation_error_logs`: SET NULL maintains system monitoring data

### 5.2 AI Generation Tracking

**Deduplication Strategy:**
- SHA256 hash of source text prevents duplicate processing
- Application checks `generations.source_text_hash` before API calls
- Reduces unnecessary API costs and improves user experience

**Statistics Collection:**
- Separate counters for unedited vs edited acceptances enable quality metrics
- `accepted_unedited_count` and `accepted_edited_count` are nullable, updated after user review
- Tracks PRD success metric: "75% wygenerowanych przez AI fiszek jest akceptowanych"
- `generated_duration` field captures API response time for performance monitoring
- Model field allows A/B testing different AI models

**Flashcard-Generation Relationship:**
- `generation_id` foreign key in flashcards links each card to its source generation
- Enables tracking which flashcards came from which generation session
- SET NULL on delete preserves flashcards even if generation record is removed

### 5.3 Scalability Considerations

**Data Types:**
- `BIGSERIAL` for flashcards supports billions of records
- `INTEGER` for counters supports counts up to 2.1 billion
- `UUID` for users enables distributed ID generation

**Indexing Strategy:**
- Partial indexes reduce index size and improve write performance
- Composite indexes eliminate need for separate single-column indexes
- Descending timestamp indexes optimize pagination queries

### 5.4 Character Limits Enforcement

**Multi-Level Validation:**
- Database CHECK constraints (hard limit, last line of defense)
- Application validation (user-friendly error messages)
- Frontend validation (immediate feedback, better UX)

**Rationale:**
- 200 characters for questions ensures concise, focused questions
- 500 characters for answers allows detailed explanations
- Prevents abuse and ensures consistent UI rendering

### 5.5 Spaced Repetition Algorithm Integration

**Database Independence:**
- No SRS metadata stored in database (per session notes decision)
- Algorithm operates in-memory during learning sessions
- Application layer calculates next review schedule
- Reduces database complexity and improves query performance

**Future Considerations:**
- Can add `last_reviewed_at` and `review_count` fields if persistence needed
- Can implement separate `review_history` table for detailed analytics
- Current design allows easy migration to stored SRS state

### 5.6 Authentication Integration

**Supabase Auth Integration:**
- Uses Supabase `auth.users` table exclusively for user management
- All foreign keys reference `auth.users(id)` 
- RLS policies use `auth.uid()` function for user identification
- Email/password authentication, OAuth, and other auth methods handled by Supabase Auth
- User registration, login, and password reset managed through Supabase Auth APIs

**Benefits:**
- No need to manage password encryption and security
- Built-in email verification and password reset flows
- Automatic session management and JWT token handling
- Compliance with security best practices out of the box

### 5.7 Out of MVP Scope

Per session notes, the following are explicitly excluded:
- Audit logging tables
- Materialized views for statistics
- Table partitioning
- ENUM types for categorical data (using VARCHAR with CHECK constraints)
- Advanced performance monitoring tables
- Flashcard sharing/collaboration tables
- Tag/category tables

### 5.8 Migration and Seeding Strategy

**Recommended Approach:**
1. Supabase Auth creates and manages the `auth.users` table (if using Supabase Auth)
2. Create custom tables in dependency order: `generations` → `flashcards`, `generation_error_logs`
3. Apply indexes after initial data load (if seeding)
4. Enable RLS and create policies after tables are populated
5. Create database functions for common operations (update timestamp)

**Trigger Recommendations:**
```sql
-- Auto-update updated_at timestamp for flashcards
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flashcards_updated_at 
  BEFORE UPDATE ON flashcards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

**Note:** Users table is managed by Supabase Auth, so no custom triggers needed for that table.

### 5.9 Testing Considerations

**Data Isolation Verification:**
- Test RLS policies with multiple user contexts
- Verify user deletion cascades correctly to flashcards
- Confirm CASCADE and SET NULL behaviors for all foreign keys

**Performance Testing:**
- Test queries with partial indexes on large datasets
- Verify index usage with EXPLAIN ANALYZE
- Monitor query performance for user dashboards

**Constraint Validation:**
- Test character limit boundaries (199, 200, 201 characters)
- Verify CHECK constraints reject invalid data
- Test email format validation

---

## 6. SQL Schema Summary

Complete schema definition ready for migration files:

```sql
-- ============================================================
-- Table: users (Managed by Supabase Auth)
-- ============================================================
-- Note: This table is created and managed by Supabase Auth.
-- Reference via auth.users or create a reference table if needed.
-- For this schema, we reference auth.uid() in RLS policies.

-- ============================================================
-- Table: generations
-- ============================================================
CREATE TABLE generations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL,
  generated_count INTEGER NOT NULL DEFAULT 0,
  generated_duration INTEGER NOT NULL DEFAULT 0,
  accepted_unedited_count INTEGER,
  accepted_edited_count INTEGER,
  source_text_hash VARCHAR(64) NOT NULL,
  source_text_length INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT generated_count_check CHECK (generated_count >= 0),
  CONSTRAINT generated_duration_check CHECK (generated_duration >= 0),
  CONSTRAINT accepted_unedited_check CHECK (accepted_unedited_count IS NULL OR accepted_unedited_count >= 0),
  CONSTRAINT accepted_edited_check CHECK (accepted_edited_count IS NULL OR accepted_edited_count >= 0),
  CONSTRAINT acceptance_logic_check CHECK (
    (accepted_unedited_count IS NULL AND accepted_edited_count IS NULL) OR
    (accepted_unedited_count + accepted_edited_count <= generated_count)
  ),
  CONSTRAINT source_length_check CHECK (source_text_length >= 1000 AND source_text_length <= 10000),
  CONSTRAINT hash_format_check CHECK (source_text_hash ~ '^[a-f0-9]{64}$')
);

-- ============================================================
-- Table: flashcards
-- ============================================================
CREATE TABLE flashcards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  front VARCHAR(200) NOT NULL,
  back VARCHAR(500) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generation_id BIGINT REFERENCES generations(id) ON DELETE SET NULL,
  CONSTRAINT front_length_check CHECK (LENGTH(front) >= 1 AND LENGTH(front) <= 200),
  CONSTRAINT back_length_check CHECK (LENGTH(back) >= 1 AND LENGTH(back) <= 500),
  CONSTRAINT source_value_check CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
);

-- ============================================================
-- Table: generation_error_logs
-- ============================================================
CREATE TABLE generation_error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL,
  source_text_hash VARCHAR(64) NOT NULL,
  source_text_length INTEGER NOT NULL,
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT error_hash_format_check CHECK (source_text_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT error_length_check CHECK (source_text_length > 0)
);
```

---

**Schema Version:** 2.0.0  
**Last Updated:** 2025-10-13  
**Status:** Ready for implementation  

**Changelog (v2.0.0):**
- Removed custom users table (now using Supabase Auth exclusively)
- Removed soft delete mechanism (deleted_at fields)
- Added generation_id foreign key to flashcards table
- Added generated_duration field to generations table
- Made accepted_unedited_count and accepted_edited_count nullable in generations
- Made user_id nullable in flashcards table
- Updated all RLS policies to use auth.users
- Updated all foreign key references to auth.users(id)

