/**
 * Flashcard Service
 *
 * Handles database operations for flashcards
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import type { FlashcardCreateDto, FlashcardDTO, ListFlashcardsQuery, UpdateFlashcardCommand } from "../../types";

type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
type FlashcardRow = Database["public"]["Tables"]["flashcards"]["Row"];
type GenerationRow = Database["public"]["Tables"]["generations"]["Row"];

/**
 * Validate that a generation exists in the database
 *
 * @param supabase - Supabase client instance
 * @param generationId - The generation ID to validate
 * @returns The generation record if found
 * @throws Error if generation not found
 */
export async function validateGenerationExists(supabase: SupabaseClient, generationId: number): Promise<GenerationRow> {
  const { data, error } = await supabase.from("generations").select("*").eq("id", generationId).single();

  if (error || !data) {
    throw new Error(`Generation with id ${generationId} not found`);
  }

  return data;
}

/**
 * Create flashcards in the database
 *
 * @param supabase - Supabase client instance
 * @param flashcards - Array of flashcard data to insert
 * @returns Array of created flashcard records
 * @throws Error if database insert fails
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  flashcards: FlashcardCreateDto[]
): Promise<FlashcardRow[]> {
  // Map DTOs to database insert format
  const flashcardsToInsert: FlashcardInsert[] = flashcards.map((flashcard) => ({
    user_id: null, // Development mode - no authentication
    front: flashcard.front.trim(),
    back: flashcard.back.trim(),
    source: flashcard.source,
    generation_id: flashcard.generation_id,
  }));

  // Batch insert flashcards
  const { data, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create flashcards:", error);
    throw new Error("Failed to create flashcards");
  }

  if (!data || data.length === 0) {
    throw new Error("No flashcards returned from database");
  }

  return data;
}

/**
 * Update acceptance counts for a generation
 * Counts ai-full as accepted_unedited_count and ai-edited as accepted_edited_count
 *
 * @param supabase - Supabase client instance
 * @param generationId - The generation ID to update
 * @param flashcards - Array of flashcards to count
 */
export async function updateAcceptanceCounts(
  supabase: SupabaseClient,
  generationId: number,
  flashcards: FlashcardCreateDto[]
): Promise<void> {
  // Count unedited and edited acceptances
  const uneditedCount = flashcards.filter((f) => f.source === "ai-full").length;
  const editedCount = flashcards.filter((f) => f.source === "ai-edited").length;

  // Skip update if no AI flashcards
  if (uneditedCount === 0 && editedCount === 0) {
    return;
  }

  // Fetch current generation record
  const { data: generation, error: fetchError } = await supabase
    .from("generations")
    .select("accepted_unedited_count, accepted_edited_count")
    .eq("id", generationId)
    .single();

  if (fetchError || !generation) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch generation for acceptance count update:", fetchError);
    return;
  }

  // Calculate new counts using COALESCE for null safety
  const newUneditedCount = (generation.accepted_unedited_count ?? 0) + uneditedCount;
  const newEditedCount = (generation.accepted_edited_count ?? 0) + editedCount;

  // Update acceptance counts
  const { error: updateError } = await supabase
    .from("generations")
    .update({
      accepted_unedited_count: newUneditedCount,
      accepted_edited_count: newEditedCount,
    })
    .eq("id", generationId);

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error("Failed to update acceptance counts:", updateError);
    // Don't throw - acceptance count update is not critical for flashcard creation
    // Log the error but allow the request to succeed
  }
}

/**
 * List flashcards for a user with pagination, filtering, and sorting.
 * Returns rows mapped to DTOs and the exact total count for pagination.
 */
export async function listFlashcards(params: {
  supabase: SupabaseClient;
  userId: string;
  query: ListFlashcardsQuery;
}): Promise<{ rows: FlashcardDTO[]; total: number }> {
  const { supabase, userId, query } = params;
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const sort = query.sort ?? "desc";

  const offset = (page - 1) * limit;
  const to = offset + limit - 1;

  // Build base data query
  let dataQuery = supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: sort === "asc" })
    .range(offset, to);

  if (query.source) {
    dataQuery = dataQuery.eq("source", query.source);
  }

  if (query.generation_id) {
    dataQuery = dataQuery.eq("generation_id", query.generation_id);
  }

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    dataQuery,
    // Separate count query with identical filters
    (() => {
      let countQuery = supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", userId);

      if (query.source) {
        countQuery = countQuery.eq("source", query.source);
      }
      if (query.generation_id) {
        countQuery = countQuery.eq("generation_id", query.generation_id);
      }
      return countQuery;
    })(),
  ]);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list flashcards:", error);
    throw new Error("Failed to list flashcards");
  }

  if (countError) {
    // eslint-disable-next-line no-console
    console.error("Failed to count flashcards:", countError);
    throw new Error("Failed to count flashcards");
  }

  const rows: FlashcardDTO[] = (data ?? []).map((row) => ({
    id: row.id,
    front: row.front,
    back: row.back,
    source: row.source as FlashcardDTO["source"],
    generation_id: row.generation_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return { rows, total: count ?? 0 };
}

/**
 * Get a single flashcard by id for a specific user. Returns null if not found.
 */
export async function getFlashcardById(params: {
  supabase: SupabaseClient;
  userId: string;
  id: number;
}): Promise<FlashcardDTO | null> {
  const { supabase, userId, id } = params;

  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch flashcard by id:", { id, userId, error });
    throw new Error("Failed to fetch flashcard");
  }

  if (!data) {
    return null;
  }

  const dto: FlashcardDTO = {
    id: data.id,
    front: data.front,
    back: data.back,
    source: data.source as FlashcardDTO["source"],
    generation_id: data.generation_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return dto;
}

/**
 * Delete a single flashcard by id for a specific user.
 * Returns true if a row was deleted, false if no matching row was found.
 */
export async function deleteFlashcard(params: {
  supabase: SupabaseClient;
  userId: string;
  id: number;
}): Promise<boolean> {
  const { supabase, userId, id } = params;

  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete flashcard:", { id, userId, error });
    throw new Error("Failed to delete flashcard");
  }

  return (count ?? 0) > 0;
}

/**
 * Update a single flashcard's editable fields for a specific user.
 * Returns the updated DTO, or null if not found/unauthorized.
 */
export async function updateFlashcard(params: {
  supabase: SupabaseClient;
  userId: string;
  id: number;
  command: UpdateFlashcardCommand;
}): Promise<FlashcardDTO | null> {
  const { supabase, userId, id, command } = params;

  const updates = {
    front: command.front.trim(),
    back: command.back.trim(),
  } as const;

  const { data, error } = await supabase
    .from("flashcards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update flashcard:", { id, userId, error });
    throw new Error("Failed to update flashcard");
  }

  if (!data) {
    return null;
  }

  const dto: FlashcardDTO = {
    id: data.id,
    front: data.front,
    back: data.back,
    source: data.source as FlashcardDTO["source"],
    generation_id: data.generation_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return dto;
}
