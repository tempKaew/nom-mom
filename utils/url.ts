/**
 * Get the base URL for API requests (origin in browser, empty on server for relative URLs).
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
