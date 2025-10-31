import React, { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useFlashcardsQuery } from "@/components/hooks/useFlashcardsQuery";
import { useFlashcardsData } from "@/components/hooks/useFlashcardsData";
import FiltersBar from "@/components/flashcards/FiltersBar";
import SortControl from "@/components/flashcards/SortControl";
import FlashcardsTable, { mapToRowVM } from "@/components/flashcards/FlashcardsTable";
import CardList from "@/components/flashcards/CardList";
import EditFlashcardModal from "@/components/flashcards/EditFlashcardModal";
import ConfirmDialog from "@/components/flashcards/ConfirmDialog";
import CreateFlashcardModal from "@/components/flashcards/CreateFlashcardModal";
import EmptyState from "@/components/flashcards/EmptyState";
import type { FlashcardDTO } from "@/types";
import { useToast } from "@/components/flashcards/Toast";

function SectionHeader({ onOpenCreate }: { onOpenCreate: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Manage Flashcards</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="default" aria-label="Add flashcard" onClick={onOpenCreate}>
          Add Flashcard
        </Button>
      </div>
    </div>
  );
}

export default function FlashcardsPage(): JSX.Element {
  const { query, setPage, setLimit, setSource, setGenerationId, setSort } = useFlashcardsQuery();

  const { data, isLoading, error, refetch } = useFlashcardsData(query);
  const { notify } = useToast();

  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [selected, setSelected] = React.useState<FlashcardDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<FlashcardDTO | null>(null);

  const onPrev = useCallback(() => {
    if (query.page > 1) setPage(query.page - 1);
  }, [query.page, setPage]);

  const onNext = useCallback(() => {
    setPage(query.page + 1);
  }, [query.page, setPage]);

  const rows = useMemo(() => mapToRowVM(data?.data ?? []), [data]);

  // Adjust pagination if current page is now out of range (e.g., after delete)
  useEffect(() => {
    if (!isLoading && !error && data?.pagination) {
      const currentPage = query.page;
      const lastPage = data.pagination.total_pages;
      if (data.data.length === 0 && data.pagination.total > 0 && currentPage > lastPage) {
        setPage(lastPage);
      }
    }
  }, [isLoading, error, data, query.page, setPage]);

  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/flashcards/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setConfirmDelete(null);
      // If we just removed the last item on the page and there are previous pages, go back a page
      const currentCount = data?.data?.length ?? 0;
      const hasPrev = data?.pagination?.has_prev ?? false;
      if (currentCount <= 1 && hasPrev) {
        setPage(Math.max(1, query.page - 1));
        // give URL time to update, then refetch
        setTimeout(() => refetch(), 0);
      } else {
        refetch();
      }
      notify("Flashcard deleted", "success");
    } catch {
      setConfirmDelete(null);
      notify("Failed to delete flashcard", "error");
    }
  }

  function handleEdit(row: ReturnType<typeof mapToRowVM>[number]) {
    setSelected(row.raw);
    setOpenEdit(true);
  }

  function handleDelete(row: ReturnType<typeof mapToRowVM>[number]) {
    setConfirmDelete(row.raw);
  }

  function handleCreated() {
    refetch();
    notify("Flashcard created", "success");
  }

  function handleUpdated() {
    refetch();
    notify("Flashcard updated", "success");
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader onOpenCreate={() => setOpenCreate(true)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FiltersBar
          source={query.source}
          generationId={query.generationId}
          limit={query.limit}
          onChangeSource={setSource}
          onChangeGenerationId={setGenerationId}
          onChangeLimit={setLimit}
        />
        <SortControl sort={query.sort} onChangeSort={setSort} />
      </div>

      {isLoading && (
        <div className="border rounded-md p-6 text-sm text-muted-foreground" role="status" aria-live="polite">
          Loading…
        </div>
      )}
      {error && (
        <div className="border rounded-md p-4 text-sm text-red-600">
          Failed to load flashcards.{" "}
          <Button
            variant="link"
            onClick={() => {
              notify("Retrying…");
              refetch();
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {!isLoading &&
        !error &&
        (rows.length === 0 ? (
          <EmptyState onCreate={() => setOpenCreate(true)} />
        ) : (
          <>
            <div className="sm:hidden">
              <CardList rows={rows} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
            <div className="hidden sm:block">
              <FlashcardsTable rows={rows} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          </>
        ))}

      <div className="flex items-center justify-between mt-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          aria-label="Previous page"
          disabled={!data?.pagination?.has_prev}
        >
          Prev
        </Button>
        <div className="text-sm">
          Page {data?.pagination?.page ?? query.page}
          {data?.pagination ? ` of ${data.pagination.total_pages}` : ""}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          aria-label="Next page"
          disabled={!data?.pagination?.has_next}
        >
          Next
        </Button>
      </div>

      <CreateFlashcardModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={() => handleCreated()} />
      <EditFlashcardModal
        open={openEdit}
        flashcard={selected}
        onClose={() => setOpenEdit(false)}
        onUpdated={() => handleUpdated()}
        onNotFound={() => {
          notify("Flashcard not found. It may have been removed.", "error");
          refetch();
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete flashcard?"
        description="This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
