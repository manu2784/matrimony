/**
 * A debounce function that delays execution until after 'wait' milliseconds 
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function(this: unknown, ...args: Parameters<T>) {
    // Clear the previous timer to reset the waiting period
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timer
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}