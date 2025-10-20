/**
 * Proposals List Component
 *
 * Container for all proposal cards with header and status summary
 */

import { memo } from "react";
import type { ProposalViewModel } from "../../lib/types/generate-view.types";
import { ProposalCard } from "./ProposalCard";
import { filterActiveProposals, countProposalsByStatus } from "../../lib/utils/generate-helpers";

interface ProposalsListProps {
  proposals: ProposalViewModel[];
  onFieldChange: (index: number, field: "front" | "back", value: string) => void;
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
}

export const ProposalsList = memo(function ProposalsList({
  proposals,
  onFieldChange,
  onAccept,
  onReject,
}: ProposalsListProps) {
  const activeProposals = filterActiveProposals(proposals);
  const counts = countProposalsByStatus(proposals);

  if (proposals.length === 0) {
    return null;
  }

  if (activeProposals.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">All proposals have been rejected. Generate new proposals to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with status summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Flashcard Proposals</h2>
        <div className="flex items-center gap-4 text-sm">
          {counts.pending > 0 && (
            <span className="text-muted-foreground">
              Pending: <span className="font-medium">{counts.pending}</span>
            </span>
          )}
          {counts.accepted > 0 && (
            <span className="text-green-700 dark:text-green-400">
              Accepted: <span className="font-medium">{counts.accepted}</span>
            </span>
          )}
          {counts.edited > 0 && (
            <span className="text-blue-700 dark:text-blue-400">
              Edited: <span className="font-medium">{counts.edited}</span>
            </span>
          )}
          {counts.rejected > 0 && (
            <span className="text-red-700 dark:text-red-400">
              Rejected: <span className="font-medium">{counts.rejected}</span>
            </span>
          )}
        </div>
      </div>

      {/* Proposals grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {proposals.map((proposal, index) => (
          <ProposalCard
            key={index}
            proposal={proposal}
            index={index}
            onFieldChange={onFieldChange}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
});
