/**
 * Source Text Input Component
 *
 * Textarea with character counter and validation feedback
 */

import { memo } from "react";
import type { SourceTextState } from "../../lib/types/generate-view.types";
import { getCharCountColorClass, SOURCE_TEXT_CONSTRAINTS } from "../../lib/utils/generate-validation";
import { cn } from "../../lib/utils";

interface SourceTextInputProps {
  sourceText: SourceTextState;
  onChange: (text: string) => void;
  disabled?: boolean;
}

export const SourceTextInput = memo(function SourceTextInput({
  sourceText,
  onChange,
  disabled = false,
}: SourceTextInputProps) {
  const counterColorClass = getCharCountColorClass(sourceText.charCount, sourceText.isValid);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="source-text" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Source Text
        </label>
        <div className={cn("text-sm font-medium", counterColorClass)} aria-live="polite">
          {sourceText.charCount.toLocaleString()} / {SOURCE_TEXT_CONSTRAINTS.MAX_LENGTH.toLocaleString()} characters
        </div>
      </div>

      <textarea
        id="source-text"
        value={sourceText.text}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Paste source text here (minimum ${SOURCE_TEXT_CONSTRAINTS.MIN_LENGTH.toLocaleString()} characters)...`}
        className={cn(
          "w-full min-h-[200px] px-3 py-2 rounded-md border text-sm",
          "bg-background text-foreground",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          !sourceText.isValid && sourceText.charCount > 0 && "border-red-500 dark:border-red-400"
        )}
        aria-invalid={!sourceText.isValid && sourceText.charCount > 0}
        aria-describedby={sourceText.validationError ? "source-text-error" : undefined}
      />

      {sourceText.validationError && (
        <p id="source-text-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
          {sourceText.validationError}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Paste {SOURCE_TEXT_CONSTRAINTS.MIN_LENGTH.toLocaleString()}-
        {SOURCE_TEXT_CONSTRAINTS.MAX_LENGTH.toLocaleString()} characters of text to generate flashcard proposals.
      </p>
    </div>
  );
});
