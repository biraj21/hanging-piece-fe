import { useMemo } from "react";

import { debounce } from "@/utils/function";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useDebounced<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  return useMemo(() => debounce(func, delay), [func, delay]);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
