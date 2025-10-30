import type { APIRoute } from "astro";
import type { ErrorResponseDTO, FlashcardDTO } from "../../../types";
import { FlashcardIdParamSchema } from "../../../lib/validation/flashcard.schemas";
import { getFlashcardById } from "../../../lib/services/flashcard.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
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

    // Validate and parse path params
    const parsed = FlashcardIdParamSchema.safeParse({ id: params.id });
    if (!parsed.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Validation Error",
        message: "Invalid path parameter",
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

    const userId = session.user.id;
    const id = parsed.data.id;

    const dto: FlashcardDTO | null = await getFlashcardById({ supabase, userId, id });

    if (!dto) {
      const errorResponse: ErrorResponseDTO = {
        error: "Not Found",
        message: "Flashcard not found",
        code: "RESOURCE_NOT_FOUND",
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(dto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/flashcards/:id:", error);
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
