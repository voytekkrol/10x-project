import React from "react";
import { ToastProvider } from "@/components/flashcards/Toast";
import FlashcardsPage from "@/components/flashcards/FlashcardsPage";

export default function FlashcardsApp(): JSX.Element {
  return (
    <ToastProvider>
      <FlashcardsPage />
    </ToastProvider>
  );
}
