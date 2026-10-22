import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { safeRedirectTarget } from './redirect-target.ts'

/**
 * Tests for the login return path.
 *
 * `?next=` is attacker-controlled, so `safeRedirectTarget` is the only
 * thing standing between a crafted link and an open redirect. Every
 * case below is one an attacker would try.
 */
describe('safeRedirectTarget', () => {
  const FALLBACK = '/dashboard'

  test('rejects a protocol-relative path', () => {
    assert.equal(safeRedirectTarget('//evil.com', FALLBACK), FALLBACK)
  })

  test('rejects a backslash-smuggled authority', () => {
    // The URL parser treats a backslash like a slash, so "/\evil.com"
    // is read as the protocol-relative "//evil.com".
    assert.equal(safeRedirectTarget('/\\evil.com', FALLBACK), FALLBACK)
  })

  test('rejects an absolute URL', () => {
    assert.equal(safeRedirectTarget('https://evil.com', FALLBACK), FALLBACK)
  })

  test('rejects a same-origin host with a protocol-relative path', () => {
    assert.equal(
      safeRedirectTarget('//internal.invalid//evil', FALLBACK),
      FALLBACK,
    )
  })

  test('rejects a tab-smuggled protocol-relative path', () => {
    // The browser strips ASCII tab and newline from a URL before it
    // parses it, so this reaches the parser as "//evil.com".
    assert.equal(safeRedirectTarget('/\t/evil.com', FALLBACK), FALLBACK)
  })

  test('rejects a newline-smuggled protocol-relative path', () => {
    assert.equal(safeRedirectTarget('/\n/evil.com', FALLBACK), FALLBACK)
  })

  test('rejects the login page itself', () => {
    assert.equal(safeRedirectTarget('/login', FALLBACK), FALLBACK)
  })

  test('rejects the login page with a trailing slash', () => {
    assert.equal(safeRedirectTarget('/login/', FALLBACK), FALLBACK)
  })

  test('rejects a missing value', () => {
    assert.equal(safeRedirectTarget(null, FALLBACK), FALLBACK)
    assert.equal(safeRedirectTarget(undefined, FALLBACK), FALLBACK)
    assert.equal(safeRedirectTarget('', FALLBACK), FALLBACK)
  })

  test('keeps a plain path', () => {
    assert.equal(safeRedirectTarget('/orders', FALLBACK), '/orders')
  })

  test('keeps the query string of a path', () => {
    assert.equal(
      safeRedirectTarget('/orders?page=2', FALLBACK),
      '/orders?page=2',
    )
  })

  test('rejects a value with a leading space', () => {
    // A leading space makes the value relative, so it would resolve
    // against whatever page the admin happens to be on.
    assert.equal(safeRedirectTarget(' /orders', FALLBACK), FALLBACK)
  })
})
