import React, { useEffect, useRef, useState } from "react";
import type { FlashcardDTO, UpdateFlashcardCommand, ErrorResponseDTO } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  flashcard: FlashcardDTO | null;
  onClose: () => void;
  onUpdated: (updated: FlashcardDTO) => void;
  onNotFound?: () => void;
}

export default function EditFlashcardModal({
  open,
  flashcard,
  onClose,
  onUpdated,
  onNotFound,
}: Props): JSX.Element | null {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ front?: string; back?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const frontRef = useRef<HTMLTextAreaElement | null>(null);
  const backRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open && flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setError(null);
      setFieldErrors(null);
      setTimeout(() => {
        frontRef.current?.focus();
      }, 0);
    }
  }, [open, flashcard]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !flashcard) return null;

  function validate(): string | null {
    if (!front || front.length < 1 || front.length > 200) return "Front must be 1-200 characters.";
    if (!back || back.length < 1 || back.length > 500) return "Back must be 1-500 characters.";
    return null;
  }

  async function onSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      if (v.includes("Front")) frontRef.current?.focus();
      else if (v.includes("Back")) backRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    const body: UpdateFlashcardCommand = { front, back };
    try {
      const res = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        if (res.status === 404) {
          onClose();
          onNotFound?.();
          return;
        }
        if (res.status === 400) {
          const err = (await res.json()) as ErrorResponseDTO;
          const map: { front?: string; back?: string } = {};
          let focus: "front" | "back" | null = null;
          err.details?.forEach((d) => {
            if (d.field === "front") map.front = d.message;
            if (d.field === "back") map.back = d.message;
            if (!focus && (d.field === "front" || d.field === "back")) focus = d.field as "front" | "back";
          });
          setFieldErrors(map);
          if (focus === "front") frontRef.current?.focus();
          if (focus === "back") backRef.current?.focus();
          throw new Error(err.message || "Validation error");
        }
        throw new Error(`Update failed: ${res.status}`);
      }
      const updated = (await res.json()) as FlashcardDTO;
      onUpdated(updated);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update flashcard.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-neutral-900 rounded-md shadow-lg p-6 w-[92vw] max-w-lg">
        <h3 className="text-lg font-semibold mb-3">Edit Flashcard</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <label htmlFor="edit-front" className="text-sm font-medium">
              Front
            </label>
            <textarea
              id="edit-front"
              ref={frontRef}
              className="border rounded-md px-3 py-2 text-sm min-h-[80px]"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              aria-invalid={!!fieldErrors?.front}
              aria-describedby={fieldErrors?.front ? "edit-front-error" : undefined}
            />
            {fieldErrors?.front ? (
              <span id="edit-front-error" className="text-xs text-red-600 mt-1">
                {fieldErrors.front}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col">
            <label htmlFor="edit-back" className="text-sm font-medium">
              Back
            </label>
            <textarea
              id="edit-back"
              ref={backRef}
              className="border rounded-md px-3 py-2 text-sm min-h-[120px]"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              aria-invalid={!!fieldErrors?.back}
              aria-describedby={fieldErrors?.back ? "edit-back-error" : undefined}
            />
            {fieldErrors?.back ? (
              <span id="edit-back-error" className="text-xs text-red-600 mt-1">
                {fieldErrors.back}
              </span>
            ) : null}
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
