# View Implementation Plan: Generate

## 1. Overview

The Generate view enables users to create flashcard proposals from pasted source text using AI. Users paste text (1,000-10,000 chars), generate proposals, review each by accepting, editing, or rejecting, then batch-save all accepted/edited proposals.

**Key capabilities:**
- Source text input with live validation (1,000-10,000 chars)
- AI generation with loading feedback and elapsed time
- Per-proposal actions: accept, edit, reject
- Batch save of accepted/edited proposals with progress tracking
- Client-side deduplication and draft persistence
- Rate limiting with countdown timer

---

## 2. Component Structure

```
GenerateView (Astro page)
├── GenerateViewContainer (React)
│   ├── SourceTextInput (textarea + validation + char counter)
│   ├── GenerateButton (triggers generation)
│   ├── GenerationStatus (loading spinner + elapsed time)
│   ├── RateLimitNotice (countdown alert)
│   ├── ProposalsList
│   │   └── ProposalCard[] (editable fields + Accept/Reject buttons)
│   ├── BatchSaveButton (saves accepted + edited)
│   ├── BatchSaveProgress (sequential save status)
│   └── SaveSummary (results + actions)
```

**Interaction Model:**
- Initial status: `pending` → User accepts → `accepted` → User edits → `edited` → User rejects → `rejected`
- Save button processes all `accepted` and `edited` proposals
- Rejected proposals are hidden from view

---

## 3. Key Types

```typescript
// View Models
interface SourceTextState {
  text: string;
  charCount: number;
  isValid: boolean;
  validationError: string | null;
}

interface GenerationState {
  isLoading: boolean;
  elapsedTime: number;
  generation: GenerationDTO | null;
  error: ErrorResponseDTO | null;
}

interface ProposalViewModel {
  originalFront: string;
  originalBack: string;
  currentFront: string;
  currentBack: string;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  isEdited: boolean;
  validationErrors: { front?: string; back?: string };
}

interface SaveState {
  isSaving: boolean;
  progress: SaveProgressItem[];
  summary: SaveSummaryData | null;
}

interface SaveProgressItem {
  proposalIndex: number;
  front: string;
  back: string;
  status: 'pending' | 'saving' | 'success' | 'duplicate' | 'error';
  error?: string;
  flashcardId?: number;
}

interface SaveSummaryData {
  totalAttempted: number;
  successCount: number;
  uneditedCount: number; // ai-full
  editedCount: number; // ai-edited
  duplicateCount: number;
  errorCount: number;
  errors: Array<{ front: string; back: string; error: string }>;
}

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  resetTime: Date | null;
}
```

---

## 4. State Management (Custom Hook)

**Hook:** `useGenerateFlashcards`

**State:**
- `sourceText`, `generation`, `proposals`, `saveState`, `rateLimit`

**Handlers:**
- `handleSourceTextChange` - validate, update char count, save draft
- `handleGenerate` - call POST /api/generations, transform to proposals with status 'pending'
- `handleProposalChange` - update fields, auto-set status to 'edited', validate
- `handleProposalAccept` - set status to 'accepted'
- `handleProposalReject` - set status to 'rejected'
- `handleBatchSave` - filter accepted/edited, sequential save, use 'ai-full' for accepted, 'ai-edited' for edited
- `handleRetry` - retry failed save

**Effects:**
- Draft persistence (localStorage)
- Elapsed time tracking during generation
- Rate limit countdown
- Unload warning for unsaved accepted/edited proposals

---

## 5. Validation Rules

**Source Text:**
- Length after trim: 1,000-10,000 characters
- Display char counter with color coding (red/green/gray)

**Proposal Fields:**
- Front: 1-200 characters (required)
- Back: 1-500 characters (required)
- Real-time validation on change
- Block save if any accepted/edited proposal has errors

**Batch Save:**
- Requires at least one accepted or edited proposal
- No validation errors in saveable proposals
- Not already saving

---

## 6. API Integration

**POST /api/generations**
- Request: `{ source_text: string }`
- Response: `GenerationDTO` with proposals array
- Handle 429 (rate limit), 401 (auth), 503 (service error)

**POST /api/flashcards**
- Request: `{ front, back, source: 'ai-full'|'ai-edited', generation_id }`
- Response: `FlashcardDTO`
- Called sequentially for each accepted/edited proposal
- Client-side deduplication using normalized front+back keys

---

## 7. User Interactions Summary

1. **Enter text** → validate, enable/disable Generate button
2. **Generate** → show loading, call API, display proposals
3. **Accept proposal** → mark as accepted, show badge, increment save count
4. **Edit proposal** → auto-mark as edited, validate, show badge
5. **Reject proposal** → hide from view
6. **Save** → sequential POST for each accepted/edited, show progress, display summary
7. **Retry failed** → re-attempt individual save

---

## 8. Error Handling

- **Validation errors:** Inline messages, red borders, disable save
- **401 (Auth):** Attempt refresh, redirect to login if fails
- **429 (Rate limit):** Display countdown, disable generate button
- **503 (Service):** Show error toast, preserve draft, allow retry
- **Network errors:** Display message, preserve state, enable retry
- **Partial save failures:** Continue processing, show summary with errors, allow individual retry

---

## 9. Implementation Steps

1. **Setup structure:** Create directories and files for components, hooks, API clients, utils
2. **Define types:** Add ViewModel types to types.ts or separate file
3. **Create utilities:** Validation functions, normalization, API error classes
4. **Build API clients:** generateProposals(), createFlashcard(), getExistingFlashcardsSet()
5. **Implement custom hook:**
   - State variables
   - Draft persistence effect
   - Generation logic with elapsed time tracking
   - Proposal management (accept/edit/reject)
   - Batch save with progress tracking
   - Rate limit countdown effect
   - Unload warning effect
6. **Create components:**
   - SourceTextInput (textarea, counter, validation)
   - GenerateButton (disabled states, tooltip)
   - GenerationStatus (spinner, time)
   - RateLimitNotice (alert, countdown)
   - ProposalsList (header, status summary, filter rejected)
   - ProposalCard (editable fields, status badge, Accept/Reject buttons, status-based styling)
   - BatchSaveButton (count, disabled logic)
   - BatchSaveProgress (progress items, status icons, retry)
   - SaveSummary (statistics, error list, actions)
7. **Create container:** GenerateViewContainer using hook, compose all components, conditional rendering
8. **Create Astro page:** Import layout, add container as client island (client:load)
9. **Style:** Apply Tailwind, ensure responsive, focus states, status-based colors
10. **Accessibility:** ARIA labels, aria-live regions, keyboard navigation, focus management
11. **Test:** Unit tests (validation, utils), integration tests (full flow), manual testing (accessibility, errors)
12. **Refine:** Code review, performance optimization (memoization, debouncing), polish UX

---

## 10. Key Implementation Notes

- **Status transitions:** pending → accepted (on Accept) → edited (on field change) → saved or rejected (hidden)
- **Source field mapping:** accepted → 'ai-full', edited → 'ai-edited'
- **Deduplication:** Normalize as `${front.trim().toLowerCase()}|${back.trim().toLowerCase()}`, check before save
- **Progress feedback:** Update UI after each save, show per-item status (pending/saving/success/duplicate/error)
- **Draft safety:** Auto-save to localStorage, warn on navigation if unsaved accepted/edited proposals
- **Rate limiting:** Parse Retry-After header, display countdown, auto-re-enable when expired
- **Partial failures:** Continue batch on error, collect errors, allow retry of failed items

---

**Estimated Effort:** 42-56 hours
**Path:** `/app/generate`
**Tech:** Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui
