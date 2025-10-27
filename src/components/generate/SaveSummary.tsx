/**
 * Save Summary Component
 *
 * Displays save operation statistics and error list with actions
 */

import { memo } from "react";
import type { SaveSummaryData } from "../../lib/types/generate-view.types";
import { Button } from "../ui/button";

interface SaveSummaryProps {
  summary: SaveSummaryData;
  onReset: () => void;
}

export const SaveSummary = memo(function SaveSummary({ summary, onReset }: SaveSummaryProps) {
  if (!summary) {
    return null;
  }

  const hasErrors = summary.errorCount > 0;
  const allFailed = summary.successCount === 0 && summary.totalAttempted > 0;
  const allSucceeded = summary.successCount === summary.totalAttempted;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div
        data-testid="save-summary"
        className={
          allFailed
            ? "rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6"
            : allSucceeded
              ? "rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-6"
              : "rounded-lg border border-gray-200 dark:border-gray-700 bg-background p-6"
        }
        role="status"
        aria-live="polite"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {allFailed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-red-600 dark:text-red-400 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                clipRule="evenodd"
              />
            </svg>
          ) : allSucceeded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-green-600 dark:text-green-400 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-blue-600 dark:text-blue-400 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <div className="flex-1">
            <h3
              className={
                allFailed
                  ? "text-lg font-semibold text-red-900 dark:text-red-100"
                  : allSucceeded
                    ? "text-lg font-semibold text-green-900 dark:text-green-100"
                    : "text-lg font-semibold text-foreground"
              }
            >
              {allFailed ? "Save Failed" : allSucceeded ? "All Flashcards Saved!" : "Save Completed"}
            </h3>
            <p
              className={
                allFailed
                  ? "text-sm text-red-700 dark:text-red-300 mt-1"
                  : allSucceeded
                    ? "text-sm text-green-700 dark:text-green-300 mt-1"
                    : "text-sm text-muted-foreground mt-1"
              }
            >
              {allFailed
                ? `Failed to save ${summary.totalAttempted} ${
                    summary.totalAttempted === 1 ? "flashcard" : "flashcards"
                  }`
                : allSucceeded
                  ? `Successfully saved ${summary.successCount} ${
                      summary.successCount === 1 ? "flashcard" : "flashcards"
                    }`
                  : `Saved ${summary.successCount} of ${summary.totalAttempted} flashcards`}
            </p>
          </div>
        </div>

        {/* Statistics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{summary.successCount}</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.uneditedCount}</p>
            <p className="text-xs text-muted-foreground">AI-Full</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{summary.editedCount}</p>
            <p className="text-xs text-muted-foreground">AI-Edited</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.duplicateCount}</p>
            <p className="text-xs text-muted-foreground">Duplicates</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.errorCount}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button data-testid="start-fresh-button" onClick={onReset} size="lg" className="flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clipRule="evenodd"
              />
            </svg>
            Start Fresh
          </Button>
        </div>
      </div>

      {/* Error list */}
      {hasErrors && summary.errors.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4">
          <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-3">
            Failed to Save ({summary.errors.length})
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {summary.errors.map((error, index) => (
              <div key={index} className="p-3 rounded-md bg-background border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-foreground truncate" title={error.front}>
                  {error.front}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
