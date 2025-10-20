/**
 * API Client for Generate View
 *
 * Provides frontend API calls for generation and flashcard creation
 */

import type {
  CreateGenerationCommand,
  GenerationDTO,
  FlashcardDTO,
  FlashcardCreateDto,
  ListFlashcardsQuery,
  FlashcardListResponseDTO,
} from "../../types";
import { fetchWithErrorHandling } from "../utils/api-errors";

/**
 * Generate flashcard proposals from source text
 *
 * @param sourceText - The source text to generate from (1000-10000 chars)
 * @returns Generation with proposals array
 * @throws AuthenticationError (401)
 * @throws RateLimitError (429) - includes retryAfter
 * @throws ServiceUnavailableError (503)
 * @throws ValidationError (400)
 * @throws NetworkError - connection issues
 */
export async function generateProposals(sourceText: string): Promise<GenerationDTO> {
  const command: CreateGenerationCommand = {
    source_text: sourceText,
  };

  return await fetchWithErrorHandling<GenerationDTO>("/api/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
}

/**
 * Create a single flashcard
 *
 * @param flashcard - Flashcard data to create
 * @returns Created flashcard with ID
 * @throws AuthenticationError (401)
 * @throws ValidationError (400)
 * @throws NetworkError - connection issues
 */
export async function createFlashcard(flashcard: FlashcardCreateDto): Promise<FlashcardDTO> {
  // API expects an array, but we return the first item
  const response = await fetchWithErrorHandling<FlashcardDTO[]>("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      flashcards: [flashcard],
    }),
  });

  if (!response || response.length === 0) {
    throw new Error("No flashcard returned from API");
  }

  return response[0];
}

/**
 * Get existing flashcards for deduplication
 * Fetches all flashcards (paginated) to build a Set of existing front+back combinations
 *
 * @param generationId - Optional: filter by generation_id
 * @returns Array of flashcards with front and back text
 */
export async function getExistingFlashcards(generationId?: number): Promise<{ front: string; back: string }[]> {
  const allFlashcards: { front: string; back: string }[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const query: ListFlashcardsQuery = {
      page: currentPage,
      limit: 100,
      sort: "desc",
      ...(generationId && { generation_id: generationId }),
    };

    const queryString = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    try {
      const response = await fetchWithErrorHandling<FlashcardListResponseDTO>(`/api/flashcards?${queryString}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      allFlashcards.push(
        ...response.data.map((f) => ({
          front: f.front,
          back: f.back,
        }))
      );

      hasMore = response.pagination.has_next;
      currentPage++;
    } catch (error) {
      // If fetching existing flashcards fails, continue without deduplication
      // Log the error but don't block the user
      // eslint-disable-next-line no-console
      console.error("Failed to fetch existing flashcards for deduplication:", error);
      break;
    }
  }

  return allFlashcards;
}
