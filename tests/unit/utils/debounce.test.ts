import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "../../../src/lib/utils/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call function after specified delay", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn("test");

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Advance timer by 499ms
    vi.advanceTimersByTime(499);
    expect(mockFn).not.toHaveBeenCalled();

    // Advance the final 1ms
    vi.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledWith("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should reset the timer on subsequent calls", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn("test1");

    // Advance timer by 300ms
    vi.advanceTimersByTime(300);
    expect(mockFn).not.toHaveBeenCalled();

    // Call again with different args
    debouncedFn("test2");

    // Advance timer by another 300ms (600ms total, but timer was reset)
    vi.advanceTimersByTime(300);
    expect(mockFn).not.toHaveBeenCalled();

    // Advance to full 500ms after second call
    vi.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledWith("test2");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should maintain the correct context and arguments", () => {
    const obj = {
      value: "test",
      method(suffix: string) {
        return `${this.value}-${suffix}`;
      },
    };

    const spy = vi.spyOn(obj, "method");
    const debouncedMethod = debounce(obj.method.bind(obj), 500);

    debouncedMethod("suffix");
    vi.advanceTimersByTime(500);

    expect(spy).toHaveBeenCalledWith("suffix");
  });

  it("should handle multiple arguments", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn("arg1", "arg2", "arg3");
    vi.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", "arg3");
  });

  it("should handle zero delay", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn("test");
    vi.advanceTimersByTime(0);

    expect(mockFn).toHaveBeenCalledWith("test");
  });

  it("should use default delay if none provided", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn); // This implementation likely uses a non-zero default delay

    debouncedFn("test");
    expect(mockFn).not.toHaveBeenCalled(); // Initially not called

    // Advance all timers to completion
    vi.runAllTimers();
    expect(mockFn).toHaveBeenCalledWith("test");
  });
});
