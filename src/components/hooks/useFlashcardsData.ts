import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlashcardListResponseDTO } from "@/types";
import type { FlashcardsQueryState } from "./useFlashcardsQuery";

interface UseFlashcardsDataResult {
  data: FlashcardListResponseDTO | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function buildQueryString(query: FlashcardsQueryState): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  // Backend expects sort as asc|desc; map from UI sort field variant
  const sortOrder = query.sort === "-created_at" ? "desc" : "asc";
  params.set("sort", sortOrder);
  if (query.source) params.set("source", query.source);
  if (query.generationId) params.set("generation_id", String(query.generationId));
  return params.toString();
}

export function useFlashcardsData(query: FlashcardsQueryState): UseFlashcardsDataResult {
  const [data, setData] = useState<FlashcardListResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const qs = useMemo(() => buildQueryString(query), [query]);

  const fetchData = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    fetch(`/api/flashcards?${qs}`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          const message = `Request failed: ${res.status}`;
          throw new Error(message);
        }
        const json = (await res.json()) as FlashcardListResponseDTO;
        setData(json);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [qs]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
