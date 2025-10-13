-- ============================================================
-- Migration: Create Performance Indexes
-- Description: Creates indexes for optimized query performance
-- Author: Database Schema v2.0.0
-- Date: 2025-10-13
-- ============================================================
-- 
-- This migration creates indexes optimized for:
-- - User-specific queries (most common access pattern)
-- - Statistics aggregation
-- - Deduplication checks
-- - Generation session lookups
-- - Error pattern analysis
--
-- Composite indexes support common query patterns identified in PRD.
-- Descending timestamp indexes optimize "recent items" queries.
-- ============================================================

-- ============================================================
-- Indexes for: flashcards table
-- ============================================================

-- User ownership queries (most frequent access pattern)
-- Optimizes: SELECT * FROM flashcards WHERE user_id = ?
create index idx_flashcards_user_id on flashcards(user_id);

-- Composite index for user flashcards with source filtering
-- Optimizes: SELECT * FROM flashcards WHERE user_id = ? AND source = ?
create index idx_flashcards_user_source on flashcards(user_id, source);

-- Timestamp-based queries for recent flashcards
-- Optimizes: SELECT * FROM flashcards ORDER BY created_at DESC
create index idx_flashcards_created_at on flashcards(created_at desc);

-- Generation session queries
-- Optimizes: SELECT * FROM flashcards WHERE generation_id = ?
-- Enables efficient lookup of all flashcards from a specific generation session
create index idx_flashcards_generation_id on flashcards(generation_id);

-- ============================================================
-- Indexes for: generations table
-- ============================================================

-- User statistics queries
-- Optimizes: SELECT * FROM generations WHERE user_id = ?
create index idx_generations_user_id on generations(user_id);

-- Deduplication checks
-- Optimizes: SELECT * FROM generations WHERE source_text_hash = ?
-- Critical for preventing duplicate AI generation requests
create index idx_generations_text_hash on generations(source_text_hash);

-- Composite index for user-specific generation history
-- Optimizes: SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC
create index idx_generations_user_created on generations(user_id, created_at desc);

-- Model performance analysis
-- Optimizes: SELECT * FROM generations WHERE model = ? ORDER BY created_at DESC
-- Enables tracking performance and acceptance rates by AI model
create index idx_generations_model on generations(model, created_at desc);

-- ============================================================
-- Indexes for: generation_error_logs table
-- ============================================================

-- Error analysis by user
-- Optimizes: SELECT * FROM generation_error_logs WHERE user_id = ?
create index idx_error_logs_user_id on generation_error_logs(user_id);

-- Error pattern analysis
-- Optimizes: SELECT * FROM generation_error_logs WHERE error_code = ? ORDER BY created_at DESC
-- Helps identify recurring error patterns and trends
create index idx_error_logs_error_code on generation_error_logs(error_code, created_at desc);

-- Model-specific error tracking
-- Optimizes: SELECT * FROM generation_error_logs WHERE model = ? ORDER BY created_at DESC
-- Tracks which AI models have the most failures
create index idx_error_logs_model on generation_error_logs(model, created_at desc);

-- Time-based error monitoring
-- Optimizes: SELECT * FROM generation_error_logs ORDER BY created_at DESC
-- Enables monitoring error rates over time
create index idx_error_logs_created_at on generation_error_logs(created_at desc);

