/**
 * Debounce utility function
 *
 * Creates a debounced version of a function that delays invoking
 * until after the specified delay has elapsed since the last call
 */

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return function debouncedFunction(...args: Parameters<T>) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
}
