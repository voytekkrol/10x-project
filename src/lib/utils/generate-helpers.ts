/**
 * Helper utilities for Generate view
 *
 * Provides normalization, deduplication, and data transformation functions
 */

import type { ProposalViewModel } from "../types/generate-view.types";
import type { FlashcardProposalDTO } from "../../types";

/**
 * Normalizes flashcard content for deduplication
 * Creates a unique key by combining front and back text
 */
export function normalizeFlashcardKey(front: string, back: string): string {
  return `${front.trim().toLowerCase()}|${back.trim().toLowerCase()}`;
}

/**
 * Transforms API proposal to view model
 */
export function transformProposalToViewModel(proposal: FlashcardProposalDTO): ProposalViewModel {
  return {
    originalFront: proposal.front,
    originalBack: proposal.back,
    currentFront: proposal.front,
    currentBack: proposal.back,
    status: "pending",
    isEdited: false,
    validationErrors: {},
  };
}

/**
 * Checks if proposal has been modified from original
 */
export function isProposalModified(proposal: ProposalViewModel): boolean {
  return (
    proposal.currentFront.trim() !== proposal.originalFront.trim() ||
    proposal.currentBack.trim() !== proposal.originalBack.trim()
  );
}

/**
 * Filters proposals by status (excludes rejected)
 */
export function filterActiveProposals(proposals: ProposalViewModel[]): ProposalViewModel[] {
  return proposals.filter((p) => p.status !== "rejected");
}

/**
 * Filters proposals ready for save (accepted or edited, no validation errors)
 */
export function filterSaveableProposals(proposals: ProposalViewModel[]): ProposalViewModel[] {
  return proposals.filter((p) => {
    const isAcceptedOrEdited = p.status === "accepted" || p.status === "edited";
    const hasNoErrors = !p.validationErrors.front && !p.validationErrors.back;
    return isAcceptedOrEdited && hasNoErrors;
  });
}

/**
 * Counts proposals by status
 */
export function countProposalsByStatus(proposals: ProposalViewModel[]): {
  pending: number;
  accepted: number;
  edited: number;
  rejected: number;
  saveable: number;
} {
  const counts = {
    pending: 0,
    accepted: 0,
    edited: 0,
    rejected: 0,
    saveable: 0,
  };

  proposals.forEach((p) => {
    counts[p.status]++;
    if ((p.status === "accepted" || p.status === "edited") && !p.validationErrors.front && !p.validationErrors.back) {
      counts.saveable++;
    }
  });

  return counts;
}

/**
 * Formats elapsed time in seconds to readable format
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Parses Retry-After header value
 * Returns retry time in seconds
 */
export function parseRetryAfter(retryAfter: string | null): number {
  if (!retryAfter) {
    return 60; // Default to 60 seconds
  }

  // Try parsing as integer (seconds)
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds;
  }

  // Try parsing as HTTP date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / 1000);
    return Math.max(diff, 0);
  }

  return 60; // Fallback
}

/**
 * Creates a Set of existing flashcard keys for deduplication
 */
export function createExistingFlashcardsSet(flashcards: { front: string; back: string }[]): Set<string> {
  return new Set(flashcards.map((f) => normalizeFlashcardKey(f.front, f.back)));
}

/**
 * Checks if a flashcard is a duplicate
 */
export function isDuplicate(front: string, back: string, existingSet: Set<string>): boolean {
  return existingSet.has(normalizeFlashcardKey(front, back));
}

/**
 * Draft persistence key for localStorage
 */
export const DRAFT_STORAGE_KEY = "generate-view-draft";

/**
 * Saves draft to localStorage
 */
export function saveDraft(sourceText: string): void {
  try {
    if (sourceText.trim().length > 0) {
      localStorage.setItem(DRAFT_STORAGE_KEY, sourceText);
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to save draft:", error);
  }
}

/**
 * Loads draft from localStorage
 */
export function loadDraft(): string | null {
  try {
    return localStorage.getItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load draft:", error);
    return null;
  }
}

/**
 * Clears draft from localStorage
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to clear draft:", error);
  }
}
