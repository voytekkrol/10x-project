## View Implementation Plan – Flashcards List & Manage

## 1. Overview
The Flashcards List & Manage view provides an authenticated user interface to browse, filter, sort, paginate, create (manual), edit, and delete flashcards. It aligns with PRD user stories US-005 (edit), US-006 (delete), and US-007 (manual create), and enforces secure access per US-009 through backend RLS and authenticated API usage.

References:
- PRD: `/.ai/prd.md`
- Endpoints: `src/pages/api/flashcards/index.ts`, `src/pages/api/flashcards/[id].ts`
- Types: `src/types.ts`
- Tech stack: `/.ai/tech-stack.md`

## 2. View Routing
- Path: `/app/flashcards`
- Page file: `src/pages/app/flashcards.astro` (Astro page hosting a React client component island for the interactive list)

## 3. Component Structure
- FlashcardsPage (React island, top-level container)
  - FiltersBar
    - SourceSelect
    - GenerationIdInput
  - SortControl
  - AddFlashcardButton
  - ContentRegion
    - EmptyState (when no results)
    - FlashcardsTable (default) OR CardList (responsive alternative)
      - Row actions: EditFlashcardAction, DeleteFlashcardAction
  - PaginationControls
  - LinkHeaderConsumer (optional; parses Link headers if adopted later)
  - CreateFlashcardModal (portal)
  - EditFlashcardModal (portal)
  - ConfirmDialog (portal for delete confirm)
  - Toasts (global notifications)

## 4. Component Details
### FlashcardsPage
- Description: Container managing query params (page, limit=20 default, source, sort default `-created_at`, generation_id), data fetching, and modals state.
- Main elements: section wrapper, header bar with filters/sort/add, results area, pagination.
- Handled interactions: filter change, sort change, pagination, open/close modals, CRUD actions, optimistic remove.
- Validation: query param coercion; ensure `limit` within [1, 100]; `page` >= 1; `generation_id` numeric; `source` in `manual|ai-full|ai-edited`; `sort` in `created_at|-created_at`.
- Types: ListFlashcardsQuery, FlashcardListResponseDTO, FlashcardDTO, ErrorResponseDTO; ViewModel types listed in section 5.
- Props: none (self-contained view island).

### AddFlashcardButton
- Description: Opens CreateFlashcardModal.
- Elements: button (shadcn/ui `Button`).
- Interactions: onClick -> open modal.
- Props: `{ onOpen: () => void }`.

### FlashcardsTable
- Description: Table of flashcards with columns: front (truncated), back (truncated), source, generation_id, created_at, actions.
- Elements: table, thead, tbody; action buttons in each row.
- Interactions: Edit, Delete; clicking row can also open edit.
- Validation: Display truncation (front 1–200, back 1–500 constraints are for forms, not listing).
- Types: `FlashcardDTO[]`.
- Props: `{ rows: FlashcardRowVM[]; onEdit: (row) => void; onDelete: (row) => void }`.

### CardList (optional/responsive)
- Description: Card layout for small screens mirroring table fields/actions.
- Elements: list of cards with title, meta, actions.
- Props: same as FlashcardsTable.

### EmptyState
- Description: Displayed when no data matches filters; suggests creating a flashcard.
- Elements: icon, text, CTA -> open CreateFlashcardModal.
- Props: `{ onCreate: () => void }`.

### PaginationControls
- Description: Prev/Next and page indicators.
- Elements: buttons for prev/next, page label (e.g., "Page X of Y").
- Interactions: onPrev, onNext; disabled states based on `has_prev`/`has_next`.
- Types: `PaginationDTO`.
- Props: `{ pagination: PaginationDTO; onChangePage: (page: number) => void }`.

### LinkHeaderConsumer (optional)
- Description: Utility to parse RFC5988 Link headers for pagination. Keep as future-proof; current backend returns pagination in body.
- Props: `{ headers?: Headers }`.

### CreateFlashcardModal
- Description: Modal with form to create a single manual flashcard with `front` and `back`.
- Elements: dialog with inputs, validation messages, submit/cancel.
- Interactions: onSubmit -> POST; onCancel -> close.
- Validation: `front` length 1–200; `back` length 1–500; `source` fixed to `manual`; `generation_id` must be null.
- Types: FlashcardCreateFormVM; response `FlashcardDTO`.
- Props: `{ open: boolean; onClose: () => void; onCreated: (created: FlashcardDTO) => void }`.

### EditFlashcardModal
- Description: Modal to edit `front`/`back` of an existing flashcard.
- Elements: dialog with inputs (prefilled), validation messages, submit/cancel.
- Interactions: onSubmit -> PUT `/api/flashcards/:id`; onCancel.
- Validation: `front` length 1–200; `back` length 1–500.
- Types: UpdateFlashcardCommand; `FlashcardDTO`.
- Props: `{ open: boolean; flashcard: FlashcardDTO | null; onClose: () => void; onUpdated: (updated: FlashcardDTO) => void }`.

### DeleteFlashcardAction + ConfirmDialog
- Description: Delete action with confirmation dialog.
- Elements: trash button; dialog with confirm/cancel.
- Interactions: onConfirm -> DELETE; optimistic removal with undo toast (optional later).
- Types: none beyond `FlashcardDTO`.
- Props: `{ onDelete: (id: number) => Promise<void> }` for action; ConfirmDialog `{ open, onConfirm, onCancel }`.

## 5. Types
Existing (from `src/types.ts`):
- `FlashcardDTO` with fields: `id`, `front`, `back`, `source`, `generation_id`, `created_at`, `updated_at`.
- `ListFlashcardsQuery` (`page?`, `limit?`, `source?`, `sort?`, `generation_id?`).
- `FlashcardListResponseDTO` (`data: FlashcardDTO[]`, `pagination: PaginationDTO`).
- `CreateFlashcardsCommand` (`flashcards: { front, back, source, generation_id }[]`).
- `UpdateFlashcardCommand` (`front`, `back`).
- `PaginationDTO`.
- `ErrorResponseDTO`.

New ViewModel types (frontend-only):
- `FlashcardsQueryState`:
  - `page: number`
  - `limit: number` (default 20)
  - `source?: FlashcardSource`
  - `generationId?: number`
  - `sort: 'created_at' | '-created_at'`
- `FlashcardRowVM` (for table/list item):
  - `id: number`
  - `frontPreview: string` (safe truncated front)
  - `backPreview: string` (safe truncated back)
  - `source: FlashcardSource`
  - `generationId?: number | null`
  - `createdAtLabel: string`
  - `raw: FlashcardDTO` (for edit)
- `FlashcardCreateFormVM`:
  - `front: string`
  - `back: string`
  - `errors?: { front?: string; back?: string; form?: string }`

## 6. State Management
- URL state: Mirror filters, sort, pagination into URLSearchParams for shareable links and back/forward navigation. Source of truth is URL; local state derives from URL.
- Remote data state: store `isLoading`, `error`, `data` for list results; refetch on URL param changes.
- Modal state: booleans for create/edit/delete dialogs; selected `FlashcardDTO | null` for edit/delete.
- Optimistic state: on delete, remove row immediately and show toast with undo (optional later). If failed, restore row and show error.
- Custom hooks:
  - `useFlashcardsQuery()` to read/write URLSearchParams and provide query object, setters, and derived pagination flags.
  - `useFlashcardsData(query)` to fetch `/api/flashcards` and return `{ data, error, isLoading, refetch }`.

## 7. API Integration
- List: GET `/api/flashcards?page={n}&limit={m}&source={s?}&sort={created_at|-created_at}&generation_id={id?}`
  - Response: `FlashcardListResponseDTO`.
- Create (manual): POST `/api/flashcards`
  - Body: `{ "flashcards": [{ "front", "back", "source": "manual", "generation_id": null }] }` (aligns with implementation in `index.ts`).
  - Response: `FlashcardDTO[]` (use first item for single-create UX).
- Update: PUT `/api/flashcards/:id`
  - Body: `UpdateFlashcardCommand`.
  - Response: `FlashcardDTO`.
- Delete: DELETE `/api/flashcards/:id`
  - Response: 204 No Content.
- Errors: 401/400/404/500 per handlers; show inline 422-like field errors for create/update when validation fails (map from 400 Validation Error with details to field messages).

## 8. User Interactions
- Change source/generation_id -> updates URL params, resets page=1, refetch.
- Toggle sort -> updates URL, refetch.
- Paginate -> updates page in URL, refetch.
- Create -> opens modal, validates, POST; on success close modal, prepend new item (refetch or local insert), show success toast.
- Edit -> opens modal with existing content; on save validate and PUT; on success update row (or refetch), show success toast.
- Delete -> confirm dialog; on confirm DELETE; on success remove row (or refetch), show success toast. If failure, restore row and show error toast.

## 9. Conditions and Validation
- Filters: ensure `generation_id` numeric; invalid input clears to undefined. `source` constrained to union.
- Create: enforce `front` 1–200, `back` 1–500, `source`=`manual`, `generation_id`=null prior to POST.
- Edit: enforce same length constraints for fields.
- Pagination: `page` >= 1; `limit` default 20, max 100; UI restricts via select or input boundaries.
- Sorting: restrict to two values only.

## 10. Error Handling
- Network/API errors: show toast with generic message; keep existing data rendered.
- Validation errors (400 with details): map `details[].field` to form fields and render inline under inputs; focus first invalid field.
- 401: redirect to auth (handled by middleware); optionally show inline message if encountered.
- 404 on update/delete: show toast; refetch list to reconcile.
- 500: toast and optional retry button.

## 11. Implementation Steps
1. Routing: create `src/pages/app/flashcards.astro` that mounts `FlashcardsPage` React island.
2. Create `src/components/flashcards/FlashcardsPage.tsx` as container; wire URL param reading and state.
3. Implement `useFlashcardsQuery` hook in `src/components/hooks/useFlashcardsQuery.ts` to manage URLSearchParams and provide setters.
4. Implement `useFlashcardsData` in `src/components/hooks/useFlashcardsData.ts` to fetch GET `/api/flashcards` based on query; include `abortController` for fast switching.
5. Build `FiltersBar` with SourceSelect and GenerationIdInput; debounce generation_id updates (300ms) using existing debounce util `src/lib/utils/debounce.ts`.
6. Build `SortControl` supporting `created_at` and `-created_at`.
7. Build `AddFlashcardButton` and `CreateFlashcardModal` using shadcn/ui primitives; validate lengths; POST body as `{ flashcards: [ {...} ] }` with `source='manual', generation_id=null`.
8. Build `FlashcardsTable` with row actions; create `formatDate` helper for `createdAtLabel`; implement safe truncation utilities.
9. Build optional `CardList` for mobile and use CSS responsive switch or prop toggle.
10. Build `EditFlashcardModal`; submit PUT; on success update row locally or `refetch`.
11. Build `DeleteFlashcardAction` + `ConfirmDialog`; call DELETE; handle optimistic removal.
12. Build `PaginationControls`; wire `onChangePage` using `pagination` from response.
13. Add toasts infrastructure if not present; show success/error as specified.
14. Accessibility: ensure modals are focus-trapped, labelled, escapable; all buttons have aria-labels; keyboard navigation for table and dialogs.
15. Testing: add unit tests for hooks and components; add E2E happy paths for list, create, edit, delete; verify auth middleware protects route.
16. Review against PRD US-005/006/007 acceptance criteria and adjust.


