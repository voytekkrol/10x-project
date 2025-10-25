import { describe, it, expect, vi, beforeEach } from "vitest";
import { debounce } from "../../../src/lib/utils/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should execute callback after specified delay", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 300);

    debouncedFn();
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous timer when called again", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 300);

    debouncedFn();
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    debouncedFn();
    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to the callback function", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 300);

    debouncedFn(1, "test", { value: true });
    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledWith(1, "test", { value: true });
  });

  it("should use the latest arguments when called multiple times", () => {
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 300);

    debouncedFn("first");
    debouncedFn("second");
    debouncedFn("third");

    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("third");
  });
});
