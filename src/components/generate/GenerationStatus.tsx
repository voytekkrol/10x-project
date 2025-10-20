/**
 * Generation Status Component
 *
 * Shows loading spinner with elapsed time during generation
 */

import { memo } from "react";
import { formatElapsedTime } from "../../lib/utils/generate-helpers";

interface GenerationStatusProps {
  isLoading: boolean;
  elapsedTime: number;
}

export const GenerationStatus = memo(function GenerationStatus({ isLoading, elapsedTime }: GenerationStatusProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
      role="status"
      aria-live="polite"
    >
      <svg
        className="animate-spin size-5 text-blue-600 dark:text-blue-400"
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

      <div className="flex-1">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Generating flashcard proposals...</p>
        <p className="text-xs text-blue-700 dark:text-blue-300">Elapsed time: {formatElapsedTime(elapsedTime)}</p>
      </div>
    </div>
  );
});
