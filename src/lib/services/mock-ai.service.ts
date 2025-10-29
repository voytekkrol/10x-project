/**
 * AI Service for flashcard generation using OpenRouter
 *
 * This service integrates with OpenRouter API to generate flashcards using LLMs.
 * Uses structured JSON output for predictable, type-safe responses.
 */

import type { FlashcardProposalDTO } from "../../types";
import { OpenRouterService } from "./openrouter.service";
import type { ResponseFormat } from "../types/openrouter.types";

export interface AIGenerationResult {
  proposals: FlashcardProposalDTO[];
  model: string;
  durationMs: number;
}

/**
 * Flashcard output schema for structured JSON generation
 */
interface FlashcardOutput {
  flashcards: {
    front: string;
    back: string;
  }[];
}

/**
 * JSON schema definition for flashcard generation
 */
const FLASHCARD_SCHEMA: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_generation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};

/**
 * System prompt for flashcard generation
 */
const SYSTEM_PROMPT = `You are an expert educational content creator specializing in creating high-quality flashcards for learning.

Your task is to generate exactly 5 flashcards from the provided text. Follow these guidelines:

1. **Questions (front)**: Create clear, specific questions that test understanding of key concepts
2. **Answers (back)**: Provide concise, accurate answers that directly address the question
3. **Coverage**: Cover the most important concepts, definitions, and facts from the text
4. **Difficulty**: Mix difficulty levels - include both foundational and deeper understanding questions
5. **Clarity**: Use simple, direct language that's easy to understand
6. **Variety**: Vary question types (what, why, how, define, explain, etc.)

Focus on creating flashcards that will help someone truly learn and retain the material.`;

/**
 * Creates OpenRouter service instance
 */
function createOpenRouterService(): OpenRouterService {
  // Get configuration from environment
  // Use process.env for runtime access (server-side) or import.meta.env as fallback
  // process.env is available at runtime and allows .env.test to work in tests
  const apiKey = process.env.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
  const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4-turbo";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return new OpenRouterService({
    apiKey,
    defaultModel,
    httpReferer: "https://flashcard-app.com",
    appName: "FlashcardGenerator",
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
  });
}

/**
 * Generate flashcard proposals from source text using AI
 *
 * @param sourceText - The text to generate flashcards from
 * @returns AI generation result with proposals, model name, and duration
 * @throws {ValidationError} If source text is empty or too short
 * @throws {OpenRouterError} If AI service fails
 */
export async function generateFlashcards(sourceText: string): Promise<AIGenerationResult> {
  // Validate input
  if (!sourceText || sourceText.trim().length === 0) {
    throw new Error("Source text cannot be empty");
  }

  if (sourceText.trim().length < 50) {
    throw new Error("Source text is too short. Please provide at least 50 characters.");
  }

  // Create service instance
  const openRouter = createOpenRouterService();

  // Generate flashcards using structured output
  const response = await openRouter.createChatCompletion<FlashcardOutput>({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Generate flashcards from the following text:\n\n${sourceText}` },
    ],
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: FLASHCARD_SCHEMA,
  });

  // Map response to expected format
  const proposals: FlashcardProposalDTO[] = response.content.flashcards.map((card) => ({
    front: card.front,
    back: card.back,
    source: "ai-full" as const,
  }));

  return {
    proposals,
    model: response.model,
    durationMs: response.durationMs,
  };
}
