/**
 * POST /api/generations - Generate flashcard proposals from source text
 *
 * This endpoint uses a mock AI service to generate flashcard proposals.
 * Proposals are returned to the client for review but not saved as flashcards
 * until the user explicitly accepts them via POST /api/flashcards.
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { supabaseClient } from "../../../db/supabase.client";
import { generateFlashcards } from "../../../lib/services/mock-ai.service";
import { calculateSourceTextHash, createGeneration } from "../../../lib/services/generation.service";
import { CreateGenerationSchema } from "../../../lib/validation/generation.schemas";
import type { ErrorResponseDTO, GenerationDTO } from "../../../types";

export const prerender = false;

/**
 * POST handler for generating flashcard proposals
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedInput = CreateGenerationSchema.parse(body);

    // Calculate source text hash for deduplication
    const sourceTextHash = calculateSourceTextHash(validatedInput.source_text);

    // Call mock AI service to generate flashcard proposals
    const aiResult = await generateFlashcards(validatedInput.source_text);

    // Store generation record in database
    const generationId = await createGeneration(supabaseClient, {
      userId: null, // No authentication - using null user_id
      model: aiResult.model,
      generatedCount: aiResult.proposals.length,
      generatedDuration: aiResult.durationMs,
      sourceTextHash: sourceTextHash,
      sourceTextLength: validatedInput.source_text.length,
    });

    // Prepare response
    const response: GenerationDTO = {
      id: generationId,
      model: aiResult.model,
      generated_count: aiResult.proposals.length,
      generated_duration: aiResult.durationMs,
      source_text_hash: sourceTextHash,
      source_text_length: validatedInput.source_text.length,
      created_at: new Date().toISOString(),
      proposals: aiResult.proposals,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation Error",
        message: "Invalid request body",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
        code: "VALIDATION_ERROR",
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Handle database and other errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/generations:", error);

    const errorResponse: ErrorResponseDTO = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
