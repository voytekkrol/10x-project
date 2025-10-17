/**
 * Validation schemas for generation endpoints
 *
 * Uses Zod for runtime type validation and type inference
 */

import { z } from "zod";

/**
 * Schema for POST /api/generations request body
 *
 * Validates source text length constraints:
 * - Minimum: 1000 characters (enough context for meaningful flashcards)
 * - Maximum: 10000 characters (prevents excessive AI costs and processing time)
 */
export const CreateGenerationSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters"),
});

/**
 * Infer TypeScript type from schema
 * This ensures type safety between validation and business logic
 */
export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;
