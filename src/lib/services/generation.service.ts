/**
 * Generation Service
 *
 * Handles database operations for AI generation sessions
 */

import { createHash } from "crypto";
import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";

type GenerationInsert = Database["public"]["Tables"]["generations"]["Insert"];
type GenerationErrorLogInsert = Database["public"]["Tables"]["generation_error_logs"]["Insert"];

export interface CreateGenerationParams {
  userId: string | null;
  model: string;
  generatedCount: number;
  generatedDuration: number;
  sourceTextHash: string;
  sourceTextLength: number;
}

export interface LogGenerationErrorParams {
  userId: string | null;
  model: string;
  sourceTextHash: string;
  sourceTextLength: number;
  errorCode: string;
  errorMessage: string;
}

/**
 * Calculate SHA256 hash of source text
 * Used for deduplication and caching
 *
 * @param sourceText - The text to hash
 * @returns Hexadecimal hash string
 */
export function calculateSourceTextHash(sourceText: string): string {
  return createHash("sha256").update(sourceText).digest("hex");
}

/**
 * Create a new generation record in the database
 *
 * @param supabase - Supabase client instance
 * @param params - Generation parameters
 * @returns Generation ID
 * @throws Error if database insert fails
 */
export async function createGeneration(supabase: SupabaseClient, params: CreateGenerationParams): Promise<number> {
  const generationData: GenerationInsert = {
    user_id: params.userId,
    model: params.model,
    generated_count: params.generatedCount,
    generated_duration: params.generatedDuration,
    source_text_hash: params.sourceTextHash,
    source_text_length: params.sourceTextLength,
  };

  const { data, error } = await supabase.from("generations").insert(generationData).select("id").single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create generation record:", error);
    throw new Error("Failed to create generation record");
  }

  if (!data) {
    throw new Error("No generation ID returned from database");
  }

  return data.id;
}

/**
 * Log a generation error to the database
 *
 * @param supabase - Supabase client instance
 * @param params - Error log parameters
 * @returns Error log ID
 * @throws Error if database insert fails
 */
export async function logGenerationError(supabase: SupabaseClient, params: LogGenerationErrorParams): Promise<number> {
  const errorLogData: GenerationErrorLogInsert = {
    user_id: params.userId,
    model: params.model,
    source_text_hash: params.sourceTextHash,
    source_text_length: params.sourceTextLength,
    error_code: params.errorCode,
    error_message: params.errorMessage,
  };

  const { data, error } = await supabase.from("generation_error_logs").insert(errorLogData).select("id").single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to log generation error:", error);
    throw new Error("Failed to log generation error");
  }

  if (!data) {
    throw new Error("No error log ID returned from database");
  }

  return data.id;
}
