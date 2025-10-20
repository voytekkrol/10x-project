/**
 * Generate View Container
 *
 * Main container component that uses the custom hook and composes all child components
 * Manages layout, conditional rendering, and component visibility based on state
 */

import { useGenerateFlashcards } from "../hooks/useGenerateFlashcards";
import { SourceTextInput } from "./SourceTextInput";
import { GenerateButton } from "./GenerateButton";
import { GenerationStatus } from "./GenerationStatus";
import { RateLimitNotice } from "./RateLimitNotice";
import { ProposalsList } from "./ProposalsList";
import { BatchSaveButton } from "./BatchSaveButton";
import { BatchSaveProgress } from "./BatchSaveProgress";
import { SaveSummary } from "./SaveSummary";
import { countProposalsByStatus } from "../../lib/utils/generate-helpers";

export function GenerateViewContainer() {
  const {
    sourceText,
    generation,
    proposals,
    saveState,
    rateLimit,
    handleSourceTextChange,
    handleGenerate,
    handleProposalChange,
    handleProposalAccept,
    handleProposalReject,
    handleBatchSave,
    handleRetry,
    handleReset,
  } = useGenerateFlashcards();

  const counts = countProposalsByStatus(proposals);
  const canGenerate = sourceText.isValid && !generation.isLoading && !rateLimit.isLimited;
  const canSave = counts.saveable > 0 && !saveState.isSaving && !generation.isLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generate Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Paste source text and let AI generate flashcard proposals. Review, edit, and save the ones you like.
          </p>
        </div>

        {/* Rate Limit Notice */}
        <RateLimitNotice rateLimit={rateLimit} />

        {/* Generation Error Display */}
        {generation.error && !generation.isLoading && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            role="alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Generation Failed</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{generation.error.message}</p>
            </div>
          </div>
        )}

        {/* Source Text Input Section */}
        <div className="space-y-4">
          <SourceTextInput
            sourceText={sourceText}
            onChange={handleSourceTextChange}
            disabled={generation.isLoading || saveState.isSaving}
          />

          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate || saveState.isSaving}
            isLoading={generation.isLoading}
            tooltipText={
              !sourceText.isValid
                ? "Please enter valid source text"
                : rateLimit.isLimited
                  ? "Rate limit reached. Please wait."
                  : undefined
            }
          />
        </div>

        {/* Generation Status */}
        <GenerationStatus isLoading={generation.isLoading} elapsedTime={generation.elapsedTime} />

        {/* Proposals Section */}
        {proposals.length > 0 && (
          <div className="space-y-6">
            <ProposalsList
              proposals={proposals}
              onFieldChange={handleProposalChange}
              onAccept={handleProposalAccept}
              onReject={handleProposalReject}
            />

            {/* Batch Save Button */}
            {!saveState.summary && (
              <BatchSaveButton
                onClick={handleBatchSave}
                saveableCount={counts.saveable}
                disabled={!canSave}
                isSaving={saveState.isSaving}
              />
            )}

            {/* Save Progress */}
            {saveState.isSaving && <BatchSaveProgress progress={saveState.progress} onRetry={handleRetry} />}

            {/* Save Summary */}
            {saveState.summary && <SaveSummary summary={saveState.summary} onReset={handleReset} />}
          </div>
        )}

        {/* Empty State (no generation yet) */}
        {proposals.length === 0 && !generation.isLoading && !generation.error && (
          <div className="text-center py-12 px-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-12 mx-auto text-muted-foreground mb-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.25 19l1.433-.394a2.25 2.25 0 001.423-1.423L16.5 16l.394 1.433a2.25 2.25 0 001.423 1.423L19.75 19l-1.433.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            <p className="text-lg font-medium text-foreground mb-2">Ready to Generate</p>
            <p className="text-sm text-muted-foreground">
              Paste your source text above and click &quot;Generate Proposals&quot; to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
