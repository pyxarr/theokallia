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
 * Only a single-slash path is returned, and it is resolved a second time
 * before it is handed back, so whatever the input, the value the router
 * receives is a same-origin path.
 */
export function safeRedirectTarget(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback

  // Only a path is meaningful here. A relative value would resolve against
  // whatever page the admin happens to be on.
  if (!value.startsWith('/')) return fallback

  const base = new URL('http://internal.invalid')

  try {
    const resolved = new URL(value, base)

    // A different origin: an absolute URL, a protocol-relative path, or a
    // value the parser rewrote into one.
    if (resolved.origin !== base.origin) return fallback

    // Sending someone back to the login page itself is a redirect loop.
    if (resolved.pathname === '/login' || resolved.pathname === '/login/') {
      return fallback
    }

    const target = resolved.pathname + resolved.search + resolved.hash

    // The resolved path can itself be protocol-relative — the parser puts
    // the path after an explicit host, so "//host//evil" yields the path
    // "//evil", which the browser reads as off-origin. Only a single-slash
    // path is ever returned.
    if (!target.startsWith('/') || target.startsWith('//')) return fallback

    // Resolve the value being returned the same way the browser will, in
    // case the parser rewrites it into another origin.
    if (new URL(target, base).origin !== base.origin) return fallback

    return target
  } catch {
    return fallback
  }
}
