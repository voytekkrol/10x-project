/**
 * Validation schemas for flashcard endpoints
 *
 * Uses Zod for runtime type validation and type inference
 */

import { z } from "zod";

/**
 * Schema for individual flashcard creation
 *
 * Validates:
 * - front: 1-200 characters (trimmed)
 * - back: 1-500 characters (trimmed)
 * - source: must be "manual", "ai-full", or "ai-edited"
 * - generation_id: required for AI sources, null for manual
 */
export const FlashcardCreateDtoSchema = z
  .object({
    front: z.string().trim().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters"),
    back: z.string().trim().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters"),
    source: z.enum(["manual", "ai-full", "ai-edited"], {
      errorMap: () => ({ message: "Source must be 'manual', 'ai-full', or 'ai-edited'" }),
    }),
    generation_id: z.number().int().positive().nullable(),
  })
  .refine(
    (data) => {
      // If source is AI-generated, generation_id must be provided
      if (data.source === "ai-full" || data.source === "ai-edited") {
        return data.generation_id !== null;
      }
      // If source is manual, generation_id must be null
      if (data.source === "manual") {
        return data.generation_id === null;
      }
      return true;
    },
    {
      message: "generation_id is required for AI-generated flashcards and must be null for manual flashcards",
      path: ["generation_id"],
    }
  );

/**
 * Schema for POST /api/flashcards request body
 *
 * Validates:
 * - flashcards array must have at least 1 item
 * - all AI flashcards must reference the same generation_id
 */
export const CreateFlashcardsCommandSchema = z
  .object({
    flashcards: z.array(FlashcardCreateDtoSchema).min(1, "At least one flashcard is required"),
  })
  .refine(
    (data) => {
      // Extract all non-null generation_ids from AI flashcards
      const aiGenerationIds = data.flashcards
        .filter((f) => f.source === "ai-full" || f.source === "ai-edited")
        .map((f) => f.generation_id)
        .filter((id) => id !== null);

      // If there are AI flashcards, they must all have the same generation_id
      if (aiGenerationIds.length > 0) {
        const firstId = aiGenerationIds[0];
        return aiGenerationIds.every((id) => id === firstId);
      }

      return true;
    },
    {
      message: "All AI-generated flashcards in a batch must reference the same generation_id",
      path: ["flashcards"],
    }
  );

/**
 * Infer TypeScript types from schemas
 * This ensures type safety between validation and business logic
 */
export type CreateFlashcardsInput = z.infer<typeof CreateFlashcardsCommandSchema>;

/**
 * Schema for GET /api/flashcards query parameters
 *
 * Supports pagination, optional filtering, and sorting.
 */
export const ListFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
  generation_id: z.coerce.number().int().positive().optional(),
});

export type ListFlashcardsQueryInput = z.infer<typeof ListFlashcardsQuerySchema>;
