/**
 * Detect if the device is mobile
 */
export function isMobileDevice(): boolean {
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera; // eslint-disable-line @typescript-eslint/no-explicit-any
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase(),
  );
}
