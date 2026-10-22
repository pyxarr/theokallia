/**
 * Resolves a `?next=` value to a path that is safe to navigate to after
 * sign-in. Only same-origin paths are allowed — a value like `//evil.com`
 * would send a freshly-authenticated admin to another site, so anything
 * that is not a plain internal path falls back.
 */
export function safeRedirectTarget(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  // `//host` and `/\host` are protocol-relative URLs, not local paths.
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  // Sending someone back to the login page itself is a redirect loop.
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login#')) {
    return fallback
  }
  return value
}
