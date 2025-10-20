/**
 * Custom Hook: useGenerateFlashcards
 *
 * Manages all state and interactions for the Generate flashcards view
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  SourceTextState,
  GenerationState,
  ProposalViewModel,
  SaveState,
  RateLimitState,
  SaveProgressItem,
  SaveSummaryData,
} from "../../lib/types/generate-view.types";
import type { FlashcardSource } from "../../types";
import { validateSourceText, validateProposal } from "../../lib/utils/generate-validation";
import {
  transformProposalToViewModel,
  isProposalModified,
  filterSaveableProposals,
  normalizeFlashcardKey,
  createExistingFlashcardsSet,
  isDuplicate,
  saveDraft,
  loadDraft,
  clearDraft,
  parseRetryAfter,
} from "../../lib/utils/generate-helpers";
import { generateProposals, createFlashcard, getExistingFlashcards } from "../../lib/api/generate-api";
import { RateLimitError, AuthenticationError, getErrorMessage } from "../../lib/utils/api-errors";
import { debounce } from "../../lib/utils/debounce";

export function useGenerateFlashcards() {
  // ============================================================================
  // State
  // ============================================================================

  const [sourceText, setSourceText] = useState<SourceTextState>({
    text: "",
    charCount: 0,
    isValid: false,
    validationError: null,
  });

  const [generation, setGeneration] = useState<GenerationState>({
    isLoading: false,
    elapsedTime: 0,
    generation: null,
    error: null,
  });

  const [proposals, setProposals] = useState<ProposalViewModel[]>([]);

  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    progress: [],
    summary: null,
  });

  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: 0,
    resetTime: null,
  });

  // Refs for intervals and timers
  const elapsedTimerRef = useRef<number | null>(null);
  const rateLimitTimerRef = useRef<number | null>(null);

  // Debounced draft save function (500ms delay)
  const debouncedSaveDraft = useMemo(() => debounce(saveDraft, 500), []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      const validation = validateSourceText(draft);
      setSourceText({
        text: draft,
        charCount: validation.charCount,
        isValid: validation.isValid,
        validationError: validation.error,
      });
    }
  }, []);

  // Elapsed time tracking during generation
  useEffect(() => {
    if (generation.isLoading) {
      const startTime = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setGeneration((prev) => ({ ...prev, elapsedTime: elapsed }));
      }, 1000);
    } else {
      if (elapsedTimerRef.current !== null) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }

    return () => {
      if (elapsedTimerRef.current !== null) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [generation.isLoading]);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimit.isLimited && rateLimit.retryAfter > 0) {
      rateLimitTimerRef.current = window.setInterval(() => {
        setRateLimit((prev) => {
          const newRetryAfter = prev.retryAfter - 1;
          if (newRetryAfter <= 0) {
            return {
              isLimited: false,
              retryAfter: 0,
              resetTime: null,
            };
          }
          return {
            ...prev,
            retryAfter: newRetryAfter,
          };
        });
      }, 1000);
    } else {
      if (rateLimitTimerRef.current !== null) {
        clearInterval(rateLimitTimerRef.current);
        rateLimitTimerRef.current = null;
      }
    }

    return () => {
      if (rateLimitTimerRef.current !== null) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, [rateLimit.isLimited, rateLimit.retryAfter]);

  // Unload warning for unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = proposals.some(
      (p) => (p.status === "accepted" || p.status === "edited") && !saveState.isSaving
    );

    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [proposals, saveState.isSaving]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle source text change with validation and draft persistence
   */
  const handleSourceTextChange = useCallback(
    (text: string) => {
      const validation = validateSourceText(text);

      setSourceText({
        text,
        charCount: validation.charCount,
        isValid: validation.isValid,
        validationError: validation.error,
      });

      // Save draft with debounce (500ms delay)
      debouncedSaveDraft(text);
    },
    [debouncedSaveDraft]
  );

  /**
   * Handle generation of proposals from source text
   */
  const handleGenerate = useCallback(async () => {
    if (!sourceText.isValid || generation.isLoading) {
      return;
    }

    setGeneration({
      isLoading: true,
      elapsedTime: 0,
      generation: null,
      error: null,
    });

    // Clear previous proposals and save state
    setProposals([]);
    setSaveState({
      isSaving: false,
      progress: [],
      summary: null,
    });

    try {
      const result = await generateProposals(sourceText.text);

      // Transform proposals to view models
      const viewModels = result.proposals.map(transformProposalToViewModel);

      setGeneration({
        isLoading: false,
        elapsedTime: 0,
        generation: result,
        error: null,
      });

      setProposals(viewModels);

      // Clear draft after successful generation
      clearDraft();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const retryAfter = error.retryAfter || parseRetryAfter(null);
        const resetTime = new Date(Date.now() + retryAfter * 1000);

        setRateLimit({
          isLimited: true,
          retryAfter,
          resetTime,
        });

        setGeneration({
          isLoading: false,
          elapsedTime: 0,
          generation: null,
          error: error.errorResponse || null,
        });
      } else if (error instanceof AuthenticationError) {
        // Attempt to refresh or redirect to login
        // For now, just show error
        setGeneration({
          isLoading: false,
          elapsedTime: 0,
          generation: null,
          error: error.errorResponse || null,
        });
      } else {
        setGeneration({
          isLoading: false,
          elapsedTime: 0,
          generation: null,
          error: {
            error: "Generation Failed",
            message: getErrorMessage(error),
            code: "AI_SERVICE_ERROR",
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  }, [sourceText.isValid, sourceText.text, generation.isLoading]);

  /**
   * Handle proposal field change
   */
  const handleProposalChange = useCallback((index: number, field: "front" | "back", value: string) => {
    setProposals((prev) => {
      const updated = [...prev];
      const proposal = { ...updated[index] };

      // Update the field
      if (field === "front") {
        proposal.currentFront = value;
      } else {
        proposal.currentBack = value;
      }

      // Check if modified from original
      const isModified = isProposalModified(proposal);

      // Update status: if modified and not already rejected, set to 'edited'
      if (isModified && proposal.status !== "rejected") {
        proposal.status = "edited";
        proposal.isEdited = true;
      } else if (!isModified && proposal.status === "edited") {
        // Reverted to original - set back to accepted or pending
        proposal.status = "accepted";
        proposal.isEdited = false;
      }

      // Validate
      proposal.validationErrors = validateProposal(proposal.currentFront, proposal.currentBack);

      updated[index] = proposal;
      return updated;
    });
  }, []);

  /**
   * Handle proposal accept
   */
  const handleProposalAccept = useCallback((index: number) => {
    setProposals((prev) => {
      const updated = [...prev];
      const proposal = { ...updated[index] };

      if (proposal.status === "pending") {
        proposal.status = "accepted";
      }

      updated[index] = proposal;
      return updated;
    });
  }, []);

  /**
   * Handle proposal reject
   */
  const handleProposalReject = useCallback((index: number) => {
    setProposals((prev) => {
      const updated = [...prev];
      const proposal = { ...updated[index] };
      proposal.status = "rejected";
      updated[index] = proposal;
      return updated;
    });
  }, []);

  /**
   * Handle batch save of accepted/edited proposals
   */
  const handleBatchSave = useCallback(async () => {
    const saveableProposals = filterSaveableProposals(proposals);

    if (saveableProposals.length === 0 || saveState.isSaving || !generation.generation) {
      return;
    }

    // Initialize progress
    const initialProgress: SaveProgressItem[] = saveableProposals.map((p) => ({
      proposalIndex: proposals.indexOf(p),
      front: p.currentFront,
      back: p.currentBack,
      status: "pending",
    }));

    setSaveState({
      isSaving: true,
      progress: initialProgress,
      summary: null,
    });

    // Fetch existing flashcards for deduplication
    const existingFlashcards = await getExistingFlashcards();
    const existingSet = createExistingFlashcardsSet(existingFlashcards);

    const summary: SaveSummaryData = {
      totalAttempted: saveableProposals.length,
      successCount: 0,
      uneditedCount: 0,
      editedCount: 0,
      duplicateCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Save each proposal sequentially
    for (let i = 0; i < saveableProposals.length; i++) {
      const proposal = saveableProposals[i];

      // Update status to saving
      setSaveState((prev) => ({
        ...prev,
        progress: prev.progress.map((item, index) => (index === i ? { ...item, status: "saving" } : item)),
      }));

      // Check for duplicate
      if (isDuplicate(proposal.currentFront, proposal.currentBack, existingSet)) {
        summary.duplicateCount++;
        setSaveState((prev) => ({
          ...prev,
          progress: prev.progress.map((item, index) => (index === i ? { ...item, status: "duplicate" } : item)),
        }));
        continue;
      }

      // Determine source based on proposal status
      const source: FlashcardSource = proposal.status === "edited" ? "ai-edited" : "ai-full";

      try {
        const flashcard = await createFlashcard({
          front: proposal.currentFront,
          back: proposal.currentBack,
          source,
          generation_id: generation.generation.id,
        });

        summary.successCount++;

        if (source === "ai-full") {
          summary.uneditedCount++;
        } else {
          summary.editedCount++;
        }

        setSaveState((prev) => ({
          ...prev,
          progress: prev.progress.map((item, index) =>
            index === i ? { ...item, status: "success", flashcardId: flashcard.id } : item
          ),
        }));

        // Add to existing set to prevent duplicates within the same batch
        existingSet.add(normalizeFlashcardKey(proposal.currentFront, proposal.currentBack));
      } catch (error) {
        summary.errorCount++;
        summary.errors.push({
          front: proposal.currentFront,
          back: proposal.currentBack,
          error: getErrorMessage(error),
        });

        setSaveState((prev) => ({
          ...prev,
          progress: prev.progress.map((item, index) =>
            index === i ? { ...item, status: "error", error: getErrorMessage(error) } : item
          ),
        }));
      }
    }

    // Update final state with summary
    setSaveState((prev) => ({
      isSaving: false,
      progress: prev.progress,
      summary,
    }));
  }, [proposals, saveState.isSaving, generation.generation]);

  /**
   * Handle retry of failed save
   */
  const handleRetry = useCallback(
    async (progressIndex: number) => {
      if (!generation.generation || saveState.isSaving) {
        return;
      }

      const progressItem = saveState.progress[progressIndex];
      if (!progressItem || progressItem.status !== "error") {
        return;
      }

      // Update status to saving
      const updatedProgress = [...saveState.progress];
      updatedProgress[progressIndex] = {
        ...progressItem,
        status: "saving",
        error: undefined,
      };

      setSaveState((prev) => ({ ...prev, progress: updatedProgress }));

      // Find the original proposal
      const proposal = proposals[progressItem.proposalIndex];
      if (!proposal) {
        return;
      }

      const source: FlashcardSource = proposal.status === "edited" ? "ai-edited" : "ai-full";

      try {
        const flashcard = await createFlashcard({
          front: progressItem.front,
          back: progressItem.back,
          source,
          generation_id: generation.generation.id,
        });

        updatedProgress[progressIndex] = {
          ...progressItem,
          status: "success",
          flashcardId: flashcard.id,
          error: undefined,
        };

        // Update summary if it exists
        if (saveState.summary) {
          const updatedSummary = { ...saveState.summary };
          updatedSummary.successCount++;
          updatedSummary.errorCount--;

          if (source === "ai-full") {
            updatedSummary.uneditedCount++;
          } else {
            updatedSummary.editedCount++;
          }

          // Remove from errors list
          updatedSummary.errors = updatedSummary.errors.filter(
            (e) => e.front !== progressItem.front || e.back !== progressItem.back
          );

          setSaveState({
            isSaving: false,
            progress: updatedProgress,
            summary: updatedSummary,
          });
        } else {
          setSaveState({
            isSaving: false,
            progress: updatedProgress,
            summary: null,
          });
        }
      } catch (error) {
        updatedProgress[progressIndex] = {
          ...progressItem,
          status: "error",
          error: getErrorMessage(error),
        };

        setSaveState((prev) => ({
          ...prev,
          progress: updatedProgress,
        }));
      }
    },
    [generation.generation, saveState.isSaving, saveState.progress, saveState.summary, proposals]
  );

  /**
   * Reset all state (for starting fresh)
   */
  const handleReset = useCallback(() => {
    setSourceText({
      text: "",
      charCount: 0,
      isValid: false,
      validationError: null,
    });
    setGeneration({
      isLoading: false,
      elapsedTime: 0,
      generation: null,
      error: null,
    });
    setProposals([]);
    setSaveState({
      isSaving: false,
      progress: [],
      summary: null,
    });
    clearDraft();
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    sourceText,
    generation,
    proposals,
    saveState,
    rateLimit,

    // Handlers
    handleSourceTextChange,
    handleGenerate,
    handleProposalChange,
    handleProposalAccept,
    handleProposalReject,
    handleBatchSave,
    handleRetry,
    handleReset,
  };
}
