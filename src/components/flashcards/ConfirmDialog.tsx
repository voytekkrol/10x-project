import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: Props): JSX.Element | null {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white dark:bg-neutral-900 rounded-md shadow-lg p-6 w-[92vw] max-w-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground mb-4">{description}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} aria-label="Cancel">
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={onConfirm} aria-label="Confirm">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
