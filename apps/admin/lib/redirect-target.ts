/**
 * Resolves a `?next=` value to a path that is safe to navigate to after
 * sign-in.
 *
 * The value comes straight from the URL, so it is untrusted. It is resolved
 * against a fixed base and its origin compared, rather than checked
 * character by character: the browser strips ASCII tab and newline from a
 * URL before parsing it, so a value like "/\t/evil.com" becomes
 * "//evil.com" — off-origin — and a first-two-characters check misses it.
 * Resolving with the same parser the browser uses catches every case at
 * once.
 *
 * Only the path is returned, so whatever the input, the value handed to the
 * router is a same-origin path.
 */
export function safeRedirectTarget(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback

  const base = new URL('http://internal.invalid')

  let resolved: URL
  try {
    resolved = new URL(value, base)
  } catch {
    return fallback
  }

  if (resolved.origin !== base.origin) return fallback

  // Sending someone back to the login page itself is a redirect loop.
  if (resolved.pathname === '/login' || resolved.pathname === '/login/') {
    return fallback
  }

  return resolved.pathname + resolved.search + resolved.hash
}
