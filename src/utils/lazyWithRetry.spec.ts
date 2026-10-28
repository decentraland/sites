import { lazy } from 'react'
import { lazyWithRetry } from './lazyWithRetry'

// `lazyWithRetry` returns a lazy component whose payload is only pulled when React
// renders it. Reaching into `_payload._result` would couple the spec to React
// internals, so instead the factory is asserted directly: the retry behaviour lives
// entirely in the wrapper passed to `lazy`, and calling it is what the specs do.
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  lazy: jest.fn(factory => ({ factory }))
}))

type LazyStub = { factory: () => Promise<unknown> }

const asStub = (value: unknown): LazyStub => value as LazyStub

const Component = (): null => null

// `resetAllMocks` in afterEach wipes mock implementations, including the module
// factory's, so `lazy` gets its pass-through behaviour back before every case.
beforeEach(() => {
  ;(lazy as unknown as jest.Mock).mockImplementation(factory => ({ factory }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('when the dynamic import resolves on the first attempt', () => {
  it('should return the module without retrying', async () => {
    const factory = jest.fn().mockResolvedValue({ default: Component })
    const lazyComponent = asStub(lazyWithRetry(factory))

    await expect(lazyComponent.factory()).resolves.toEqual({ default: Component })
    expect(factory).toHaveBeenCalledTimes(1)
  })
})

describe('when the dynamic import fails once and then succeeds', () => {
  it('should resolve with the module from the retry', async () => {
    const factory = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
      .mockResolvedValueOnce({ default: Component })
    const lazyComponent = asStub(lazyWithRetry(factory))

    await expect(lazyComponent.factory()).resolves.toEqual({ default: Component })
    expect(factory).toHaveBeenCalledTimes(2)
  })
})

describe('when the dynamic import fails twice', () => {
  it('should rethrow the first error rather than the retry error', async () => {
    const firstError = new Error('first failure')
    const factory = jest.fn().mockRejectedValueOnce(firstError).mockRejectedValueOnce(new Error('retry failure'))
    const lazyComponent = asStub(lazyWithRetry(factory))

    await expect(lazyComponent.factory()).rejects.toBe(firstError)
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('should stop after a single retry', async () => {
    const factory = jest.fn().mockRejectedValue(new Error('always down'))
    const lazyComponent = asStub(lazyWithRetry(factory))

    await expect(lazyComponent.factory()).rejects.toThrow('always down')
    expect(factory).toHaveBeenCalledTimes(2)
  })
})
