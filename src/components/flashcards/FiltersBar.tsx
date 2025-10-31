import React, { useCallback, useMemo, useState } from "react";
import type { FlashcardSource } from "@/types";
import { debounce } from "@/lib/utils/debounce";

interface Props {
  source?: FlashcardSource;
  generationId?: number;
  limit: number;
  onChangeSource: (s: FlashcardSource | undefined) => void;
  onChangeGenerationId: (id: number | undefined) => void;
  onChangeLimit: (limit: number) => void;
}

export default function FiltersBar({
  source,
  generationId,
  limit,
  onChangeSource,
  onChangeGenerationId,
  onChangeLimit,
}: Props): JSX.Element {
  const [localGenId, setLocalGenId] = useState<string>(generationId ? String(generationId) : "");

  const debouncedChangeGenId = useMemo(
    () =>
      debounce((value: string) => {
        const n = Number(value);
        if (value === "" || !Number.isFinite(n)) onChangeGenerationId(undefined);
        else onChangeGenerationId(Math.max(1, Math.floor(n)));
      }, 300),
    [onChangeGenerationId]
  );

  const handleGenIdChange = useCallback(
    (value: string) => {
      setLocalGenId(value);
      debouncedChangeGenId(value);
    },
    [debouncedChangeGenId]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end w-full">
      <div className="flex flex-col">
        <label htmlFor="source" className="text-sm font-medium">
          Source
        </label>
        <select
          id="source"
          className="border rounded-md px-3 py-2 text-sm"
          value={source ?? ""}
          onChange={(e) => onChangeSource(e.target.value === "" ? undefined : (e.target.value as FlashcardSource))}
        >
          <option value="">All</option>
          <option value="manual">Manual</option>
          <option value="ai-full">AI Full</option>
          <option value="ai-edited">AI Edited</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="generationId" className="text-sm font-medium">
          Generation ID
        </label>
        <input
          id="generationId"
          type="number"
          className="border rounded-md px-3 py-2 text-sm"
          value={localGenId}
          onChange={(e) => handleGenIdChange(e.target.value)}
          placeholder="e.g. 123"
          min={1}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="limit" className="text-sm font-medium">
          Per page
        </label>
        <input
          id="limit"
          type="number"
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-28"
          value={limit}
          onChange={(e) => onChangeLimit(Number(e.target.value))}
          min={1}
          max={100}
        />
      </div>
    </div>
  );
}
