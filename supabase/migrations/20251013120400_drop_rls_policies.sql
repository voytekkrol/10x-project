-- ============================================================
-- Migration: Drop Row Level Security (RLS) Policies
-- Description: Drops all RLS policies for flashcards, generations, and generation_error_logs tables
-- Author: Database Schema v2.0.0
-- Date: 2025-10-13
-- ============================================================
-- 
-- This migration removes all RLS policies previously created in
-- migration 20251013120200_enable_rls_policies.sql
--
-- Note: RLS remains enabled on tables, but no policies are active.
-- This means no one can access the data unless new policies are created
-- or RLS is disabled on the tables.
-- ============================================================

-- ============================================================
-- Drop RLS Policies for: flashcards table
-- ============================================================

drop policy if exists "Users can view their own flashcards" on flashcards;
drop policy if exists "Users can create their own flashcards" on flashcards;
drop policy if exists "Users can update their own flashcards" on flashcards;
drop policy if exists "Users can delete their own flashcards" on flashcards;

-- ============================================================
-- Drop RLS Policies for: generations table
-- ============================================================

drop policy if exists "Users can view their own generations" on generations;
drop policy if exists "Users can create their own generations" on generations;

-- ============================================================
-- Drop RLS Policies for: generation_error_logs table
-- ============================================================

drop policy if exists "Users can view their own error logs" on generation_error_logs;
drop policy if exists "Authenticated users can create error logs" on generation_error_logs;
drop policy if exists "Anonymous users can create error logs" on generation_error_logs;

