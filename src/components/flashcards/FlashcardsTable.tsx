import React from "react";
import type { FlashcardDTO } from "@/types";
import { Button } from "@/components/ui/button";

export interface FlashcardRowVM {
  id: number;
  frontPreview: string;
  backPreview: string;
  source: FlashcardDTO["source"];
  generationId?: number | null;
  createdAtLabel: string;
  raw: FlashcardDTO;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function mapToRowVM(items: FlashcardDTO[]): FlashcardRowVM[] {
  return items.map((fc) => ({
    id: fc.id,
    frontPreview: truncate(fc.front, 80),
    backPreview: truncate(fc.back, 120),
    source: fc.source,
    generationId: fc.generation_id,
    createdAtLabel: formatDate(fc.created_at),
    raw: fc,
  }));
}

interface Props {
  rows: FlashcardRowVM[];
  onEdit: (row: FlashcardRowVM) => void;
  onDelete: (row: FlashcardRowVM) => void;
}

export default function FlashcardsTable({ rows, onEdit, onDelete }: Props): JSX.Element {
  if (rows.length === 0) {
    return <div className="border rounded-md p-6 text-sm text-muted-foreground">No flashcards found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-2 pr-4">Front</th>
            <th className="py-2 pr-4">Back</th>
            <th className="py-2 pr-4">Source</th>
            <th className="py-2 pr-4">Generation</th>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2 pr-0">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 pr-4 align-top max-w-[280px]">{r.frontPreview}</td>
              <td className="py-2 pr-4 align-top max-w-[420px]">{r.backPreview}</td>
              <td className="py-2 pr-4 align-top">{r.source}</td>
              <td className="py-2 pr-4 align-top">{r.generationId ?? "—"}</td>
              <td className="py-2 pr-4 align-top whitespace-nowrap">{r.createdAtLabel}</td>
              <td className="py-2 pr-0 align-top">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Edit flashcard ${r.id}`}
                    title="Edit"
                    onClick={() => onEdit(r)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    aria-label={`Delete flashcard ${r.id}`}
                    title="Delete"
                    onClick={() => onDelete(r)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
