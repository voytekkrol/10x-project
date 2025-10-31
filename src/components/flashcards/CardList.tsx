import React from "react";
import type { FlashcardRowVM } from "@/components/flashcards/FlashcardsTable";
import { Button } from "@/components/ui/button";

interface Props {
  rows: FlashcardRowVM[];
  onEdit: (row: FlashcardRowVM) => void;
  onDelete: (row: FlashcardRowVM) => void;
}

export default function CardList({ rows, onEdit, onDelete }: Props): JSX.Element {
  if (rows.length === 0) return <div className="text-sm text-muted-foreground">No flashcards found.</div>;

  return (
    <div className="grid grid-cols-1 gap-3">
      {rows.map((r) => (
        <div key={r.id} className="border rounded-md p-4">
          <div className="font-medium mb-1">{r.frontPreview}</div>
          <div className="text-sm text-muted-foreground mb-2">{r.backPreview}</div>
          <div className="text-xs text-muted-foreground mb-3 flex gap-3">
            <span>Source: {r.source}</span>
            <span>Gen: {r.generationId ?? "—"}</span>
            <span>{r.createdAtLabel}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(r)} aria-label={`Edit ${r.id}`} title="Edit">
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(r)}
              aria-label={`Delete ${r.id}`}
              title="Delete"
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
