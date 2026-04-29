import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom
if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder: TE, TextDecoder: TD } = require('util')
  globalThis.TextEncoder = TE as typeof globalThis.TextEncoder
  globalThis.TextDecoder = TD as typeof globalThis.TextDecoder
}

// Polyfill global fetch
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = jest.fn() as unknown as typeof fetch
}

// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver
}
