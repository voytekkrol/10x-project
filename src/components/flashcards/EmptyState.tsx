import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onCreate: () => void;
}

export default function EmptyState({ onCreate }: Props): JSX.Element {
  return (
    <div className="border rounded-md p-8 text-center">
      <div className="text-sm text-muted-foreground mb-3">No flashcards found for the current filters.</div>
      <Button variant="outline" onClick={onCreate} aria-label="Create flashcard">
        Create a flashcard
      </Button>
    </div>
  );
}
