/**
 * Batch Save Button Component
 *
 * Save button showing count of saveable proposals with disabled logic
 */

import { memo } from "react";
import { Button } from "../ui/button";

interface BatchSaveButtonProps {
  onClick: () => void;
  saveableCount: number;
  disabled: boolean;
  isSaving: boolean;
}

export const BatchSaveButton = memo(function BatchSaveButton({
  onClick,
  saveableCount,
  disabled,
  isSaving,
}: BatchSaveButtonProps) {
  if (saveableCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
      <div>
        <p className="text-sm font-medium text-foreground">
          Ready to save {saveableCount} {saveableCount === 1 ? "flashcard" : "flashcards"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Accepted and edited proposals will be saved to your collection
        </p>
      </div>
      <Button
        onClick={onClick}
        disabled={disabled || isSaving}
        size="lg"
        className="shrink-0"
        aria-label={`Save ${saveableCount} flashcards`}
      >
        {isSaving ? (
          <>
            <svg
              className="animate-spin size-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>Save {saveableCount}</span>
          </>
        )}
      </Button>
    </div>
  );
});
