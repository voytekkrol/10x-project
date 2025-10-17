/**
 * Flashcard Service
 *
 * Handles database operations for flashcards
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import type { FlashcardCreateDto } from "../../types";

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
