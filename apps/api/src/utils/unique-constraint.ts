/**
 * Prisma reports a unique-constraint violation with error code P2002.
 * Narrowed without `any` so the caller can decide what to do with it:
 * the shipping-zone service turns it into a 409 Conflict, and the
 * site-config service re-reads the row a concurrent request just wrote.
 */
export function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  )
}
