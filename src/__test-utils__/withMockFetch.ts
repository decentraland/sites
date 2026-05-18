/**
 * Run a callback with `global.fetch` swapped for a mock and guarantee
 * restoration via try/finally — even if the callback throws or rejects.
 *
 * The previous pattern duplicated `const originalFetch = global.fetch; global.fetch = ...; try { ... } finally { global.fetch = originalFetch }` across ~14 specs, several without the finally. A throw mid-test left the next test with a stale fetch.
 *
 * Usage:
 *   await withMockFetch(jest.fn().mockResolvedValue(new Response()), async fetchMock => {
 *     // ... assertions referencing fetchMock
 *   })
 */
async function withMockFetch<T>(impl: jest.Mock | typeof fetch, callback: (fetchMock: jest.Mock) => Promise<T> | T): Promise<T> {
  const original = global.fetch
  const fetchMock = (
    typeof impl === 'function' && 'mock' in (impl as unknown as { mock?: unknown }) ? impl : jest.fn(impl as typeof fetch)
  ) as jest.Mock
  global.fetch = fetchMock as unknown as typeof fetch
  try {
    return await callback(fetchMock)
  } finally {
    global.fetch = original
  }
}

export { withMockFetch }
