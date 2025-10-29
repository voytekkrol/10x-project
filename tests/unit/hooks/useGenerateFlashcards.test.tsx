import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateFlashcards } from "../../../src/components/hooks/useGenerateFlashcards";

// Mock the API calls
vi.mock("../../../src/lib/api/generate-api", () => ({
  generateProposals: vi.fn(),
  createFlashcard: vi.fn(),
  getExistingFlashcards: vi.fn().mockResolvedValue([]),
}));

// Mock the helper functions
vi.mock("../../../src/lib/utils/generate-helpers", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    saveDraft: vi.fn(),
    loadDraft: vi.fn().mockReturnValue(null),
    clearDraft: vi.fn(),
  };
});

// Import mocked functions
import { generateProposals, createFlashcard, getExistingFlashcards } from "../../../src/lib/api/generate-api";
import { loadDraft, saveDraft, clearDraft } from "../../../src/lib/utils/generate-helpers";
import { RateLimitError } from "../../../src/lib/utils/api-errors";

describe("useGenerateFlashcards", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useGenerateFlashcards());

    expect(result.current.sourceText.text).toBe("");
    expect(result.current.sourceText.isValid).toBe(false);
    expect(result.current.generation.isLoading).toBe(false);
    expect(result.current.proposals).toEqual([]);
    expect(result.current.saveState.isSaving).toBe(false);
    expect(result.current.rateLimit.isLimited).toBe(false);
  });

  it("should load draft text on mount if available", () => {
    // Generate text longer than MIN_LENGTH (1000 chars)
    const longDraftText = "A".repeat(1500);
    vi.mocked(loadDraft).mockReturnValueOnce(longDraftText);

    const { result } = renderHook(() => useGenerateFlashcards());

    expect(result.current.sourceText.text).toBe(longDraftText);
    expect(result.current.sourceText.isValid).toBe(true);
    expect(loadDraft).toHaveBeenCalledTimes(1);
  });

  it("should update source text with validation", async () => {
    const { result } = renderHook(() => useGenerateFlashcards());

    await act(async () => {
      result.current.handleSourceTextChange("Short");
    });

    expect(result.current.sourceText.text).toBe("Short");
    expect(result.current.sourceText.isValid).toBe(false);
    expect(result.current.sourceText.validationError).toBe(
      "Source text must be at least 1000 characters (currently 5)"
    );

    // Create valid text (over 1000 chars)
    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    expect(result.current.sourceText.text).toBe(validText);
    expect(result.current.sourceText.isValid).toBe(true);
    expect(result.current.sourceText.validationError).toBeNull();

    // Wait for debounce
    vi.advanceTimersByTime(500);
    expect(saveDraft).toHaveBeenCalledWith(validText);
  });

  it("should handle generate proposals successfully", async () => {
    const mockProposals = [
      { id: "1", front: "Test front 1", back: "Test back 1" },
      { id: "2", front: "Test front 2", back: "Test back 2" },
    ];

    vi.mocked(generateProposals).mockResolvedValueOnce({
      id: "gen-123",
      proposals: mockProposals,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useGenerateFlashcards());

    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(generateProposals).toHaveBeenCalledWith(validText);
    expect(result.current.generation.isLoading).toBe(false);
    expect(result.current.proposals.length).toBe(2);
    expect(clearDraft).toHaveBeenCalled();
  });

  it("should handle rate limit errors", async () => {
    const errorResponse = {
      error: "Rate Limit Exceeded",
      message: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString(),
    };

    const rateLimitError = new RateLimitError("Rate limit exceeded", 60, errorResponse);
    vi.mocked(generateProposals).mockRejectedValueOnce(rateLimitError);

    const { result } = renderHook(() => useGenerateFlashcards());

    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(result.current.rateLimit.isLimited).toBe(true);
    expect(result.current.rateLimit.retryAfter).toBe(60);
    expect(result.current.generation.error).toEqual(errorResponse);

    // Test countdown
    await act(async () => {
      vi.advanceTimersByTime(30 * 1000); // 30 seconds
    });

    expect(result.current.rateLimit.retryAfter).toBe(30);

    // Complete countdown
    await act(async () => {
      vi.advanceTimersByTime(30 * 1000); // another 30 seconds
    });

    expect(result.current.rateLimit.isLimited).toBe(false);
    expect(result.current.rateLimit.retryAfter).toBe(0);
  });

  it("should handle proposal acceptance and rejection", async () => {
    const mockProposals = [
      { id: "1", front: "Test front 1", back: "Test back 1" },
      { id: "2", front: "Test front 2", back: "Test back 2" },
    ];

    vi.mocked(generateProposals).mockResolvedValueOnce({
      id: "gen-123",
      proposals: mockProposals,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useGenerateFlashcards());

    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Accept first proposal
    act(() => {
      result.current.handleProposalAccept(0);
    });

    expect(result.current.proposals[0].status).toBe("accepted");

    // Reject second proposal
    act(() => {
      result.current.handleProposalReject(1);
    });

    expect(result.current.proposals[1].status).toBe("rejected");
  });

  it("should handle proposal editing", async () => {
    const mockProposals = [{ id: "1", front: "Test front 1", back: "Test back 1" }];

    vi.mocked(generateProposals).mockResolvedValueOnce({
      id: "gen-123",
      proposals: mockProposals,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useGenerateFlashcards());

    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Edit front side
    act(() => {
      result.current.handleProposalChange(0, "front", "Edited front 1");
    });

    expect(result.current.proposals[0].currentFront).toBe("Edited front 1");
    expect(result.current.proposals[0].status).toBe("edited");
    expect(result.current.proposals[0].isEdited).toBe(true);

    // Edit back to original value
    act(() => {
      result.current.handleProposalChange(0, "front", "Test front 1");
    });

    expect(result.current.proposals[0].currentFront).toBe("Test front 1");
    expect(result.current.proposals[0].status).toBe("accepted");
    expect(result.current.proposals[0].isEdited).toBe(false);
  });

  it("should handle batch saving", async () => {
    const mockProposals = [
      { id: "1", front: "Test front 1", back: "Test back 1" },
      { id: "2", front: "Test front 2", back: "Test back 2" },
    ];

    vi.mocked(generateProposals).mockResolvedValueOnce({
      id: "gen-123",
      proposals: mockProposals,
      timestamp: new Date().toISOString(),
    });

    vi.mocked(createFlashcard).mockResolvedValueOnce({ id: "card-1" }).mockResolvedValueOnce({ id: "card-2" });

    const { result } = renderHook(() => useGenerateFlashcards());

    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Accept both proposals
    act(() => {
      result.current.handleProposalAccept(0);
      result.current.handleProposalAccept(1);
    });

    await act(async () => {
      await result.current.handleBatchSave();
    });

    expect(getExistingFlashcards).toHaveBeenCalled();
    expect(createFlashcard).toHaveBeenCalledTimes(2);
    expect(result.current.saveState.summary).not.toBeNull();
    expect(result.current.saveState.summary?.successCount).toBe(2);
  });

  it("should handle reset correctly", async () => {
    const mockProposals = [{ id: "1", front: "Test front 1", back: "Test back 1" }];

    vi.mocked(generateProposals).mockResolvedValueOnce({
      id: "gen-123",
      proposals: mockProposals,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useGenerateFlashcards());

    const validText = "A".repeat(1500);
    await act(async () => {
      result.current.handleSourceTextChange(validText);
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(result.current.proposals.length).toBe(1);

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.sourceText.text).toBe("");
    expect(result.current.proposals.length).toBe(0);
    expect(clearDraft).toHaveBeenCalled();
  });
});
