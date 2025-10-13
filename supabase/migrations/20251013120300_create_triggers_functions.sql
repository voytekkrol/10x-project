-- ============================================================
-- Migration: Create Database Functions and Triggers
-- Description: Creates helper functions and triggers for automated operations
-- Author: Database Schema v2.0.0
-- Date: 2025-10-13
-- ============================================================
-- 
-- This migration creates:
-- 1. Function to auto-update the updated_at timestamp
-- 2. Trigger on flashcards table to call the update function
--
-- This ensures the updated_at column is automatically maintained
-- without requiring application logic to set it on every update.
-- ============================================================

-- ============================================================
-- Function: update_updated_at_column()
-- Purpose: Automatically sets updated_at to current timestamp on row updates
-- ============================================================

-- Create or replace function to update the updated_at column
-- This function is called by triggers before any UPDATE operation
-- Returns: Modified NEW record with updated_at set to now()
create or replace function update_updated_at_column()
returns trigger as $$
begin
  -- Set the updated_at column to the current timestamp
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add comment explaining the function purpose
comment on function update_updated_at_column() is 'Automatically updates the updated_at column to current timestamp on row updates. Called by triggers.';

-- ============================================================
-- Trigger: Auto-update updated_at on flashcards table
-- ============================================================

-- Create trigger to automatically update updated_at timestamp
-- Fires: BEFORE UPDATE on flashcards table
-- Action: Calls update_updated_at_column() function to set updated_at = now()
-- Rationale: Ensures updated_at is always accurate without application logic
create trigger update_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();

-- Add comment explaining the trigger purpose
comment on trigger update_flashcards_updated_at on flashcards is 'Automatically updates updated_at column to current timestamp whenever a flashcard is modified';

