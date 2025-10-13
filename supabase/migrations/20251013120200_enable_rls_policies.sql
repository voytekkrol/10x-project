-- ============================================================
-- Migration: Enable Row Level Security (RLS) Policies
-- Description: Enables RLS and creates security policies for all tables
-- Author: Database Schema v2.0.0
-- Date: 2025-10-13
-- ============================================================
-- 
-- This migration implements the security architecture with RLS policies
-- ensuring strict data isolation between users.
--
-- Security Architecture:
-- - All tables have RLS enabled
-- - Users can only access their own data (auth.uid() = user_id)
-- - Generation and error log records are immutable (no update/delete policies)
-- - Service role can bypass RLS for administrative operations
--
-- Implements security requirement from US-009:
-- "Tylko zalogowany użytkownik może wyświetlać, edytować i usuwać swoje fiszki."
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

-- Enable RLS on flashcards table
-- Users can only view, create, update, and delete their own flashcards
alter table flashcards enable row level security;

-- Enable RLS on generations table
-- Users can only view and create their own generation records
alter table generations enable row level security;

-- Enable RLS on generation_error_logs table
-- Users can view their own error logs; system can create error logs
alter table generation_error_logs enable row level security;

-- ============================================================
-- RLS Policies for: flashcards table
-- ============================================================

-- Policy: Allow users to view only their own flashcards
-- Rationale: Ensures data privacy and isolation between users
create policy "Users can view their own flashcards"
on flashcards
for select
using (
  auth.uid() = user_id
);

-- Policy: Allow users to insert flashcards for themselves only
-- Rationale: Prevents users from creating flashcards under another user's account
create policy "Users can create their own flashcards"
on flashcards
for insert
with check (
  auth.uid() = user_id
);

-- Policy: Allow users to update only their own flashcards
-- Rationale: Ensures users cannot modify other users' flashcards
-- Uses both USING and WITH CHECK to validate ownership before and after update
create policy "Users can update their own flashcards"
on flashcards
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

-- Policy: Allow users to delete only their own flashcards
-- Rationale: Prevents users from deleting other users' flashcards
create policy "Users can delete their own flashcards"
on flashcards
for delete
using (
  auth.uid() = user_id
);

-- ============================================================
-- RLS Policies for: generations table
-- ============================================================

-- Policy: Allow users to view only their own generation statistics
-- Rationale: Generation statistics are private to each user
create policy "Users can view their own generations"
on generations
for select
using (
  auth.uid() = user_id
);

-- Policy: Allow users to create generation records for themselves only
-- Rationale: Prevents users from creating generation records under another user's account
create policy "Users can create their own generations"
on generations
for insert
with check (
  auth.uid() = user_id
);

-- Note: No UPDATE policy - generation records are immutable after creation
-- This preserves the integrity of generation statistics and acceptance rates

-- Note: No DELETE policy - generation records are preserved for statistics
-- Flashcards can be deleted, but generation history is maintained for analytics

-- ============================================================
-- RLS Policies for: generation_error_logs table
-- ============================================================

-- Policy: Allow users to view only their own error logs
-- Rationale: Error logs may contain sensitive information about user's text
create policy "Users can view their own error logs"
on generation_error_logs
for select
using (
  auth.uid() = user_id
);

-- Policy: Allow authenticated users to create error logs
-- Rationale: System/application needs to create error logs for any user
-- Note: This allows the service role to log errors even when user context exists
create policy "Authenticated users can create error logs"
on generation_error_logs
for insert
to authenticated
with check (true);

-- Policy: Allow anonymous users to create error logs
-- Rationale: Errors may occur before user authentication completes
create policy "Anonymous users can create error logs"
on generation_error_logs
for insert
to anon
with check (true);

-- Note: No UPDATE policy - error logs are immutable for audit integrity
-- Note: No DELETE policy - error logs are preserved for system monitoring and debugging

