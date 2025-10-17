/**
 * POST /api/flashcards - Create flashcards (manual or AI-generated)
 *
 * This endpoint creates flashcards and updates acceptance statistics
 * for AI-generated flashcards to track quality metrics.
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { supabaseClient } from "../../../db/supabase.client";
import {
  createFlashcards,
  validateGenerationExists,
  updateAcceptanceCounts,
} from "../../../lib/services/flashcard.service";
import { CreateFlashcardsCommandSchema } from "../../../lib/validation/flashcard.schemas";
import type { ErrorResponseDTO, FlashcardDTO } from "../../../types";

export const prerender = false;

/**
 * POST handler for creating flashcards
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedInput = CreateFlashcardsCommandSchema.parse(body);

    // Extract generation_id from AI flashcards (if any)
    const aiFlashcard = validatedInput.flashcards.find((f) => f.source === "ai-full" || f.source === "ai-edited");
    const generationId = aiFlashcard?.generation_id;

    // Validate generation exists if flashcards are AI-generated
    if (generationId !== null && generationId !== undefined) {
      try {
        await validateGenerationExists(supabaseClient, generationId);
      } catch {
        const errorResponse: ErrorResponseDTO = {
          error: "Not Found",
          message: `Generation with id ${generationId} not found`,
          code: "RESOURCE_NOT_FOUND",
          timestamp: new Date().toISOString(),
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Create flashcards in database
    const createdFlashcards = await createFlashcards(supabaseClient, validatedInput.flashcards);

    // Update acceptance counts for AI-generated flashcards
    if (generationId !== null && generationId !== undefined) {
      await updateAcceptanceCounts(supabaseClient, generationId, validatedInput.flashcards);
    }

    // Map to DTOs (omit user_id)
    const flashcardDTOs: FlashcardDTO[] = createdFlashcards.map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      generation_id: flashcard.generation_id,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    }));

    return new Response(JSON.stringify(flashcardDTOs), {
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
    console.error("Error in POST /api/flashcards:", error);

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
