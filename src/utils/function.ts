/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Creates a debounced version of the provided function.
 * The function will only be called after the specified delay has passed
 * since the last time it was invoked.
 *
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
