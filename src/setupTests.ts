import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom
if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder: TE, TextDecoder: TD } = require('util')
  globalThis.TextEncoder = TE as typeof globalThis.TextEncoder
  globalThis.TextDecoder = TD as typeof globalThis.TextDecoder
}

// Polyfill global fetch + Fetch API classes (jsdom omits Request/Response/Headers).
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = jest.fn() as unknown as typeof fetch
}
if (typeof globalThis.Response === 'undefined' || typeof globalThis.Request === 'undefined' || typeof globalThis.Headers === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require('undici') as { Response: typeof Response; Request: typeof Request; Headers: typeof Headers }
  globalThis.Response = undici.Response
  globalThis.Request = undici.Request
  globalThis.Headers = undici.Headers
}

// Polyfill AbortSignal.timeout (jsdom omits this static method)
if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as { timeout?: unknown }).timeout !== 'function') {
  ;(AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = (ms: number): AbortSignal => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new DOMException('TimeoutError', 'TimeoutError')), ms)
    return controller.signal
  }
}

// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver
}
