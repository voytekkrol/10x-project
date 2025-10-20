/**
 * Rate Limit Notice Component
 *
 * Displays countdown alert when user is rate limited
 */

import { memo } from "react";
import type { RateLimitState } from "../../lib/types/generate-view.types";
import { formatElapsedTime } from "../../lib/utils/generate-helpers";

interface RateLimitNoticeProps {
  rateLimit: RateLimitState;
}

export const RateLimitNotice = memo(function RateLimitNotice({ rateLimit }: RateLimitNoticeProps) {
  if (!rateLimit.isLimited) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
      role="alert"
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Rate Limit Reached</p>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
          You&apos;ve reached the generation limit. Please wait {formatElapsedTime(rateLimit.retryAfter)} before trying
          again.
        </p>
        {rateLimit.resetTime && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Available again at {rateLimit.resetTime.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
});
