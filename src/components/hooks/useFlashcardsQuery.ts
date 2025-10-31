import { useCallback, useEffect, useState } from "react";
import type { FlashcardSource } from "@/types";

export interface FlashcardsQueryState {
  page: number;
  limit: number;
  source?: FlashcardSource;
  generationId?: number;
  sort: "created_at" | "-created_at";
}

const DEFAULTS: FlashcardsQueryState = {
  page: 1,
  limit: 20,
  sort: "-created_at",
};

function parseNumberOrUndefined(value: string | null): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULTS.limit;
  if (limit < 1) return 1;
  if (limit > 100) return 100;
  return Math.floor(limit);
}

export function useFlashcardsQuery() {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  const [query, setQuery] = useState<FlashcardsQueryState>(DEFAULTS);

  useEffect(() => {
    if (!isBrowser) return;
    const nextUrl = new URL(window.location.href);
    const params = nextUrl.searchParams;
    const next: FlashcardsQueryState = {
      page: Math.max(1, parseNumberOrUndefined(params.get("page")) ?? DEFAULTS.page),
      limit: clampLimit(parseNumberOrUndefined(params.get("limit")) ?? DEFAULTS.limit),
      source: ((): FlashcardsQueryState["source"] => {
        const v = params.get("source");
        if (!v) return undefined;
        if (v === "manual" || v === "ai-full" || v === "ai-edited") return v;
        return undefined;
      })(),
      generationId: parseNumberOrUndefined(params.get("generation_id")),
      sort: ((): FlashcardsQueryState["sort"] => {
        const v = params.get("sort");
        return v === "created_at" || v === "-created_at" ? v : DEFAULTS.sort;
      })(),
    };
    setQuery(next);
  }, [isBrowser]);

  const updateParams = useCallback(
    (updater: (p: URLSearchParams) => void) => {
      if (!isBrowser) return;
      const next = new URL(window.location.href);
      const p = next.searchParams;
      updater(p);
      window.history.replaceState({}, "", `${next.pathname}?${p.toString()}`);
    },
    [isBrowser]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const value = Math.max(1, Math.floor(nextPage));
      setQuery((prev) => ({ ...prev, page: value }));
      updateParams((p) => {
        p.set("page", String(value));
      });
    },
    [updateParams]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      const clamped = clampLimit(nextLimit);
      setQuery((prev) => ({ ...prev, limit: clamped, page: 1 }));
      updateParams((p) => {
        p.set("limit", String(clamped));
        p.set("page", "1");
      });
    },
    [updateParams]
  );

  const setSource = useCallback(
    (nextSource: FlashcardSource | undefined) => {
      setQuery((prev) => ({ ...prev, source: nextSource, page: 1 }));
      updateParams((p) => {
        if (!nextSource) p.delete("source");
        else p.set("source", nextSource);
        p.set("page", "1");
      });
    },
    [updateParams]
  );

  const setGenerationId = useCallback(
    (nextId: number | undefined) => {
      setQuery((prev) => ({ ...prev, generationId: nextId, page: 1 }));
      updateParams((p) => {
        if (nextId === undefined || !Number.isFinite(nextId)) p.delete("generation_id");
        else p.set("generation_id", String(Math.max(1, Math.floor(nextId))));
        p.set("page", "1");
      });
    },
    [updateParams]
  );

  const setSort = useCallback(
    (nextSort: FlashcardsQueryState["sort"]) => {
      setQuery((prev) => ({ ...prev, sort: nextSort, page: 1 }));
      updateParams((p) => {
        p.set("sort", nextSort);
        p.set("page", "1");
      });
    },
    [updateParams]
  );

  return {
    query,
    setPage,
    setLimit,
    setSource,
    setGenerationId,
    setSort,
  } as const;
}
