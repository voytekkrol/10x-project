/**
 * Proposal Card Component
 *
 * Displays a single flashcard proposal with editable fields,
 * status badge, and Accept/Reject actions
 */

import { memo } from "react";
import type { ProposalViewModel } from "../../lib/types/generate-view.types";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { PROPOSAL_FIELD_CONSTRAINTS } from "../../lib/utils/generate-validation";

interface ProposalCardProps {
  proposal: ProposalViewModel;
  index: number;
  onFieldChange: (index: number, field: "front" | "back", value: string) => void;
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
}

export const ProposalCard = memo(function ProposalCard({
  proposal,
  index,
  onFieldChange,
  onAccept,
  onReject,
}: ProposalCardProps) {
  // Don't render rejected proposals
  if (proposal.status === "rejected") {
    return null;
  }

  const getStatusBadge = () => {
    switch (proposal.status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            Accepted
          </span>
        );
      case "edited":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
            Edited
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clipRule="evenodd"
              />
            </svg>
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const getCardBorderClass = () => {
    switch (proposal.status) {
      case "accepted":
        return "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20";
      case "edited":
        return "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20";
      default:
        return "border-gray-200 dark:border-gray-700 bg-background";
    }
  };

  return (
    <div
      data-testid={`proposal-card-${index}`}
      data-proposal-status={proposal.status}
      className={cn("rounded-lg border p-4 space-y-4 transition-colors", getCardBorderClass())}
    >
      {/* Header with index and status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">Proposal #{index + 1}</span>
        {getStatusBadge()}
      </div>

      {/* Front field */}
      <div className="space-y-1.5">
        <label htmlFor={`proposal-${index}-front`} className="text-sm font-medium text-foreground">
          Front
        </label>
        <textarea
          id={`proposal-${index}-front`}
          data-testid={`proposal-${index}-front-input`}
          value={proposal.currentFront}
          onChange={(e) => onFieldChange(index, "front", e.target.value)}
          rows={2}
          className={cn(
            "w-full px-3 py-2 rounded-md border text-sm",
            "bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
            "resize-y",
            proposal.validationErrors.front && "border-red-500 dark:border-red-400"
          )}
          aria-invalid={!!proposal.validationErrors.front}
          aria-describedby={proposal.validationErrors.front ? `proposal-${index}-front-error` : undefined}
        />
        <div className="flex items-center justify-between">
          {proposal.validationErrors.front ? (
            <p id={`proposal-${index}-front-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
              {proposal.validationErrors.front}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {proposal.currentFront.trim().length} / {PROPOSAL_FIELD_CONSTRAINTS.FRONT_MAX} characters
            </p>
          )}
        </div>
      </div>

      {/* Back field */}
      <div className="space-y-1.5">
        <label htmlFor={`proposal-${index}-back`} className="text-sm font-medium text-foreground">
          Back
        </label>
        <textarea
          id={`proposal-${index}-back`}
          data-testid={`proposal-${index}-back-input`}
          value={proposal.currentBack}
          onChange={(e) => onFieldChange(index, "back", e.target.value)}
          rows={3}
          className={cn(
            "w-full px-3 py-2 rounded-md border text-sm",
            "bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
            "resize-y",
            proposal.validationErrors.back && "border-red-500 dark:border-red-400"
          )}
          aria-invalid={!!proposal.validationErrors.back}
          aria-describedby={proposal.validationErrors.back ? `proposal-${index}-back-error` : undefined}
        />
        <div className="flex items-center justify-between">
          {proposal.validationErrors.back ? (
            <p id={`proposal-${index}-back-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
              {proposal.validationErrors.back}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {proposal.currentBack.trim().length} / {PROPOSAL_FIELD_CONSTRAINTS.BACK_MAX} characters
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {proposal.status === "pending" && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            data-testid={`proposal-${index}-accept-button`}
            onClick={() => onAccept(index)}
            size="sm"
            className="flex-1"
            aria-label={`Accept proposal ${index + 1}`}
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
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Accept
          </Button>
          <Button
            data-testid={`proposal-${index}-reject-button`}
            onClick={() => onReject(index)}
            variant="outline"
            size="sm"
            className="flex-1"
            aria-label={`Reject proposal ${index + 1}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
});
