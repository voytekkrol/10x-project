/**
 * DTO (Data Transfer Object) and Command Model Types
 *
 * This file contains type definitions for API requests and responses.
 * All types are derived from database models defined in database.types.ts
 * Types are organized by endpoint for better maintainability.
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from database tables)
// ============================================================================

type FlashcardEntity = Database["public"]["Tables"]["flashcards"]["Row"];
type GenerationEntity = Database["public"]["Tables"]["generations"]["Row"];
type GenerationErrorLogEntity = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// Database insert/update types
export type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
export type FlashcardUpdate = Database["public"]["Tables"]["flashcards"]["Update"];

// ============================================================================
// Enum Types
// ============================================================================

/**
 * Source of flashcard creation: manual entry or AI-generated (full/edited)
 */
export type FlashcardSource = "manual" | "ai-full" | "ai-edited";

export type SortOrder = "asc" | "desc";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_REQUIRED"
  | "AUTHORIZATION_FAILED"
  | "RESOURCE_NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "AI_SERVICE_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

// ============================================================================
// Shared DTOs
// ============================================================================

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ErrorDetailDTO {
  field: string;
  message: string;
}

/**
 * Standard error response format for all API errors
 */
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: ErrorDetailDTO[];
  code: ErrorCode;
  timestamp: string;
}

// ============================================================================
// FLASHCARDS ENDPOINTS
// ============================================================================

/**
 * Flashcard DTO - omits internal user_id field
 * Used in: GET /api/flashcards/:id, POST /api/flashcards, PUT /api/flashcards/:id
 */
export type FlashcardDTO = Pick<
  FlashcardEntity,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// ----------------------------------------------------------------------------
// GET /api/flashcards - List flashcards with pagination
// ----------------------------------------------------------------------------

export interface ListFlashcardsQuery {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
  sort?: SortOrder;
  generation_id?: number;
}

export interface FlashcardListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// ----------------------------------------------------------------------------
// POST /api/flashcards - Create flashcards (manual or AI-generated)
// ----------------------------------------------------------------------------

export interface FlashcardCreateDto {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id: number | null;
}

export interface CreateFlashcardsCommand {
  flashcards: FlashcardCreateDto[];
}

// Response: FlashcardDTO[]

// ----------------------------------------------------------------------------
// PUT /api/flashcards/:id - Update flashcard
// ----------------------------------------------------------------------------

export type UpdateFlashcardCommand = Pick<FlashcardUpdate, "front" | "back">;

// Response: FlashcardDTO

// ----------------------------------------------------------------------------
// DELETE /api/flashcards/:id - Delete flashcard
// ----------------------------------------------------------------------------

// No request/response body

// ============================================================================
// GENERATIONS ENDPOINTS
// ============================================================================

// ----------------------------------------------------------------------------
// POST /api/generations - Generate flashcard proposals from source text
// ----------------------------------------------------------------------------

export interface CreateGenerationCommand {
  source_text: string;
}

/**
 * Flashcard proposal from AI generation (not yet saved to database)
 */
export interface FlashcardProposalDTO {
  front: string;
  back: string;
  source: "ai-full";
}

/**
 * Generation response DTO - omits user_id and acceptance counts
 */
export type GenerationDTO = Omit<GenerationEntity, "user_id" | "accepted_edited_count" | "accepted_unedited_count"> & {
  proposals: FlashcardProposalDTO[];
  cached?: boolean;
};

// Response: GenerationDTO

// ----------------------------------------------------------------------------
// GET /api/generations - List generation sessions
// ----------------------------------------------------------------------------

export interface ListGenerationsQuery {
  page?: number;
  limit?: number;
  sort?: SortOrder;
}

export interface GenerationListResponseDTO {
  data: Omit<GenerationEntity, "user_id">[];
  pagination: PaginationDTO;
}

// ----------------------------------------------------------------------------
// GET /api/generations/:id - Get generation details with accepted flashcards
// ----------------------------------------------------------------------------

/**
 * Generation detail DTO - includes acceptance counts and associated flashcards
 */
export type GenerationDetailDTO = Omit<GenerationEntity, "user_id"> & {
  flashcards: FlashcardDTO[];
};

// Response: GenerationDetailDTO

// ============================================================================
// GENERATION ERROR LOGS ENDPOINTS
// ============================================================================

// ----------------------------------------------------------------------------
// GET /api/generation-error-logs - List AI generation errors
// ----------------------------------------------------------------------------

export interface ListGenerationErrorLogsQuery {
  page?: number;
  limit?: number;
  model?: string;
  error_code?: string;
  from_date?: string;
  to_date?: string;
  sort?: SortOrder;
}

/**
 * Generation error log DTO - omits internal user_id field
 */
export type GenerationErrorLogDTO = Omit<GenerationErrorLogEntity, "user_id">;

export interface GenerationErrorLogListResponseDTO {
  data: GenerationErrorLogDTO[];
  pagination: PaginationDTO;
}
