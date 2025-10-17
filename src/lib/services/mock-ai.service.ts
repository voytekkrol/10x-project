/**
 * Mock AI Service for flashcard generation
 *
 * This service simulates AI-powered flashcard generation for development and testing.
 * Replace with actual AI service integration (OpenRouter/OpenAI) in production.
 */

import type { FlashcardProposalDTO } from "../../types";

export interface AIGenerationResult {
  proposals: FlashcardProposalDTO[];
  model: string;
  durationMs: number;
}

const MODEL_NAME = "mock-ai-model";
const SIMULATED_DELAY_MS = 100;

/**
 * Simulate processing delay to mimic real AI service
 */
async function simulateDelay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, SIMULATED_DELAY_MS);
  });
}

/**
 * Generate predefined mock flashcard proposals
 *
 * @param sourceText - Source text (used for context-aware generation in production)
 * @returns Array of flashcard proposals
 */
function generateMockProposals(sourceText: string): FlashcardProposalDTO[] {
  // Extract first few words for context-aware mock generation
  const firstWords = sourceText.substring(0, 50).trim();
  const contextHint = firstWords.length < sourceText.length ? `${firstWords}...` : firstWords;

  return [
    {
      front: "What is the main topic of this text?",
      back: `The text discusses: "${contextHint}"`,
      source: "ai-full",
    },
    {
      front: "What key concept is introduced in this passage?",
      back: "A fundamental concept that requires understanding and memorization.",
      source: "ai-full",
    },
    {
      front: "What is an important definition from this text?",
      back: "A precise definition of a key term or concept.",
      source: "ai-full",
    },
    {
      front: "What is a critical detail to remember?",
      back: "An essential fact or detail that supports the main ideas.",
      source: "ai-full",
    },
    {
      front: "How does this concept relate to broader topics?",
      back: "This concept connects to wider themes and applications.",
      source: "ai-full",
    },
  ];
}

/**
 * Generate flashcard proposals from source text
 *
 * @param sourceText - The text to generate flashcards from
 * @returns AI generation result with proposals, model name, and duration
 */
export async function generateFlashcards(sourceText: string): Promise<AIGenerationResult> {
  const startTime = Date.now();

  // Simulate AI processing delay
  await simulateDelay();

  // Generate mock flashcard proposals
  const proposals = generateMockProposals(sourceText);

  const durationMs = Date.now() - startTime;

  return {
    proposals,
    model: MODEL_NAME,
    durationMs,
  };
}
