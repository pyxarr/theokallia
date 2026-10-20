import { Transform } from 'class-transformer'
import type { TransformFnParams } from 'class-transformer'

/**
 * Parses a body value strictly, so the global ValidationPipe's implicit
 * conversion cannot guess at it.
 *
 * `enableImplicitConversion: true` turns `""` into `0` and `"false"` into
 * `true`, so a cleared form field would silently store 0. This transform
 * runs after that conversion, so it reads the RAW body value through
 * `obj[key]` and converts it itself: a blank string becomes NaN, which
 * `@IsInt()` and `@IsNumber()` reject.
 */
export const StrictValue = () =>
  Transform(({ obj, key }: TransformFnParams) => {
    const raw: unknown = obj?.[key]
    if (typeof raw !== 'string') return raw
    const text = raw.trim()
    if (text === 'true') return true
    if (text === 'false') return false
    if (text === '') return NaN
    const n = Number(text)
    return Number.isNaN(n) ? raw : n
  })
