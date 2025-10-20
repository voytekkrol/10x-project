/**
 * Batch Save Progress Component
 *
 * Shows sequential save progress with status icons and retry actions
 */

import { memo } from "react";
import type { SaveProgressItem } from "../../lib/types/generate-view.types";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface BatchSaveProgressProps {
  progress: SaveProgressItem[];
  onRetry: (progressIndex: number) => void;
}

export const BatchSaveProgress = memo(function BatchSaveProgress({ progress, onRetry }: BatchSaveProgressProps) {
  if (progress.length === 0) {
    return null;
  }

  const getStatusIcon = (status: SaveProgressItem["status"]) => {
    switch (status) {
      case "pending":
        return <div className="size-5 rounded-full border-2 border-gray-300 dark:border-gray-600" aria-hidden="true" />;
      case "saving":
        return (
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
        );
      case "success":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5 text-green-600 dark:text-green-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "duplicate":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5 text-red-600 dark:text-red-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getStatusText = (item: SaveProgressItem) => {
    switch (item.status) {
      case "pending":
        return "Waiting...";
      case "saving":
        return "Saving...";
      case "success":
        return "Saved successfully";
      case "duplicate":
        return "Duplicate (skipped)";
      case "error":
        return item.error || "Failed to save";
    }
  };

  const getStatusColor = (status: SaveProgressItem["status"]) => {
    switch (status) {
      case "success":
        return "text-green-700 dark:text-green-400";
      case "duplicate":
        return "text-amber-700 dark:text-amber-400";
      case "error":
        return "text-red-700 dark:text-red-400";
      case "saving":
        return "text-blue-700 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <h3 className="text-sm font-medium text-foreground">Save Progress</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {progress.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 p-3 rounded-md border",
              item.status === "error"
                ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                : item.status === "success"
                  ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                  : item.status === "duplicate"
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-gray-200 dark:border-gray-700 bg-background"
            )}
          >
            <div className="shrink-0 mt-0.5">{getStatusIcon(item.status)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" title={item.front}>
                {item.front}
              </p>
              <p className={cn("text-xs mt-0.5", getStatusColor(item.status))}>{getStatusText(item)}</p>
            </div>
            {item.status === "error" && (
              <Button
                onClick={() => onRetry(index)}
                variant="outline"
                size="sm"
                className="shrink-0"
                aria-label={`Retry saving ${item.front}`}
              >
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
                Retry
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
