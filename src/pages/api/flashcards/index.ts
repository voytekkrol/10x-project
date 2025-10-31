/**
 * POST /api/flashcards - Create flashcards (manual or AI-generated)
 *
 * This endpoint creates flashcards and updates acceptance statistics
 * for AI-generated flashcards to track quality metrics.
 */

import type { APIRoute } from "astro";
import { ZodError } from "zod";
import {
  createFlashcards,
  validateGenerationExists,
  updateAcceptanceCounts,
  listFlashcards,
} from "../../../lib/services/flashcard.service";
import { CreateFlashcardsCommandSchema, ListFlashcardsQuerySchema } from "../../../lib/validation/flashcard.schemas";
import type { ErrorResponseDTO, FlashcardDTO, FlashcardListResponseDTO } from "../../../types";
import { getUserId } from "../../../lib/utils/auth-helpers";

export const prerender = false;

/**
 * POST handler for creating flashcards
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const session = locals.session ?? null;

    if (!supabase || !session) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized",
        message: "Authentication required",
        code: "AUTHENTICATION_REQUIRED",
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedInput = CreateFlashcardsCommandSchema.parse(body);

    // Extract generation_id from AI flashcards (if any)
    const aiFlashcard = validatedInput.flashcards.find((f) => f.source === "ai-full" || f.source === "ai-edited");
    const generationId = aiFlashcard?.generation_id;

    // Validate generation exists if flashcards are AI-generated
    if (generationId !== null && generationId !== undefined) {
      try {
        await validateGenerationExists(supabase, generationId);
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
    const userId = getUserId(session);
    const createdFlashcards = await createFlashcards(supabase, validatedInput.flashcards, userId);

    // Update acceptance counts for AI-generated flashcards
    if (generationId !== null && generationId !== undefined) {
      await updateAcceptanceCounts(supabase, generationId, validatedInput.flashcards);
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

/**
 * GET /api/flashcards - List authenticated user's flashcards
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const supabase = locals.supabase;
    const session = locals.session ?? null;

    if (!supabase || !session) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized",
        message: "Authentication required",
        code: "AUTHENTICATION_REQUIRED",
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate query parameters
    const rawQuery = Object.fromEntries(url.searchParams.entries());
    const parsed = ListFlashcardsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation Error",
        message: "Invalid query parameters",
        details: parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
        code: "VALIDATION_ERROR",
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = getUserId(session);
    const { rows, total } = await listFlashcards({
      supabase,
      userId,
      query: parsed.data,
    });

    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const responseBody: FlashcardListResponseDTO = {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/flashcards:", error);
    const errorResponse: ErrorResponseDTO = {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
