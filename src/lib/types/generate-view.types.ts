/**
 * View Model Types for Generate View
 *
 * These types define the client-side state and data structures
 * used exclusively in the Generate flashcards view.
 */

import type { GenerationDTO, ErrorResponseDTO } from "../../types";

/**
 * Source text input state with validation
 */
export interface SourceTextState {
  text: string;
  charCount: number;
  isValid: boolean;
  validationError: string | null;
}

/**
 * Generation API call state
 */
export interface GenerationState {
  isLoading: boolean;
  elapsedTime: number;
  generation: GenerationDTO | null;
  error: ErrorResponseDTO | null;
}

/**
 * Proposal status lifecycle:
 * - pending: Initial state after generation
 * - accepted: User clicked Accept
 * - edited: User modified fields (auto-set on change)
 * - rejected: User clicked Reject (hidden from view)
 */
export type ProposalStatus = "pending" | "accepted" | "edited" | "rejected";

/**
 * Client-side proposal view model
 * Tracks original AI values vs user edits
 */
export interface ProposalViewModel {
  originalFront: string;
  originalBack: string;
  currentFront: string;
  currentBack: string;
  status: ProposalStatus;
  isEdited: boolean;
  validationErrors: {
    front?: string;
    back?: string;
  };
}

/**
 * Save progress item status
 */
export type SaveProgressStatus = "pending" | "saving" | "success" | "duplicate" | "error";

/**
 * Individual proposal save progress
 */
export interface SaveProgressItem {
  proposalIndex: number;
  front: string;
  back: string;
  status: SaveProgressStatus;
  error?: string;
  flashcardId?: number;
}

/**
 * Summary statistics after batch save operation
 */
export interface SaveSummaryData {
  totalAttempted: number;
  successCount: number;
  uneditedCount: number; // ai-full
  editedCount: number; // ai-edited
  duplicateCount: number;
  errorCount: number;
  errors: {
    front: string;
    back: string;
    error: string;
  }[];
}

/**
 * Save operation state
 */
export interface SaveState {
  isSaving: boolean;
  progress: SaveProgressItem[];
  summary: SaveSummaryData | null;
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  resetTime: Date | null;
}

/**
 * Complete Generate view state
 */
export interface GenerateViewState {
  sourceText: SourceTextState;
  generation: GenerationState;
  proposals: ProposalViewModel[];
  saveState: SaveState;
  rateLimit: RateLimitState;
}
