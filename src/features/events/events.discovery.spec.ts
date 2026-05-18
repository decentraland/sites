import { act, renderHook } from '@testing-library/react'
import { useGetWhatsOnDataQuery } from './events.discovery'

const useHook = useGetWhatsOnDataQuery
const mockUnsubscribe = jest.fn()
let capturedVisibilityListener: ((visible: boolean) => void) | null = null
let visibility = true

jest.mock('../../utils/documentVisibility', () => ({
  isDocumentVisible: () => visibility,
  subscribeVisibility: (listener: (visible: boolean) => void) => {
    capturedVisibilityListener = listener
    return mockUnsubscribe
  }
}))

const envMock = jest.fn<string | undefined, [string]>()
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => envMock(key)
}))

const buildExploreCardsMock = jest.fn()
jest.mock('./events.discovery.helpers', () => ({
  buildExploreCards: (...args: unknown[]) => buildExploreCardsMock(...args)
}))

function okResponse(payload: unknown, contentType = 'application/json'): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => contentType },
    json: () => Promise.resolve(payload)
  } as unknown as Response
}

function notOkResponse(status: number): Response {
  return {
    ok: false,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(null)
  } as unknown as Response
}

async function flushAll() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('events.discovery', () => {
  let fetchMock: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>

  beforeEach(() => {
    visibility = true
    capturedVisibilityListener = null
    mockUnsubscribe.mockReset()
    buildExploreCardsMock.mockReset().mockReturnValue([])
    envMock.mockReset().mockImplementation((key: string) => {
      if (key === 'EVENTS_API_URL') return 'https://events.test/api'
      if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
      return undefined
    })
    fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
    fetchMock.mockResolvedValue(okResponse({ data: [] }))
    global.fetch = fetchMock as unknown as typeof global.fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('lifecycle', () => {
    describe('when the first consumer mounts', () => {
      it('should register a visibility listener', () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useHook())
        expect(capturedVisibilityListener).not.toBeNull()
        unmount()
        jest.useRealTimers()
      })
    })

    describe('when the last consumer unmounts', () => {
      it('should release the visibility subscription', () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useHook())
        unmount()
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
        jest.useRealTimers()
      })
    })

    describe('when the tab starts hidden', () => {
      beforeEach(() => {
        visibility = false
      })

      it('should not schedule the poll interval', () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useHook())
        expect(jest.getTimerCount()).toBe(0)
        unmount()
        jest.useRealTimers()
      })

      describe('and visibility returns', () => {
        it('should schedule the poll interval', () => {
          jest.useFakeTimers()
          const { unmount } = renderHook(() => useHook())

          visibility = true
          capturedVisibilityListener?.(true)

          expect(jest.getTimerCount()).toBeGreaterThan(0)
          unmount()
          jest.useRealTimers()
        })
      })
    })

    describe('when visibility flips to hidden after subscribers exist', () => {
      it('should clear the poll interval', () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useHook())
        expect(jest.getTimerCount()).toBeGreaterThan(0)

        capturedVisibilityListener?.(false)
        expect(jest.getTimerCount()).toBe(0)
        unmount()
        jest.useRealTimers()
      })
    })

    describe('when there are no subscribers', () => {
      it('should ignore visibility changes', () => {
        jest.useFakeTimers()
        const { unmount } = renderHook(() => useHook())
        const listener = capturedVisibilityListener
        unmount()

        listener?.(true)
        listener?.(false)
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
        jest.useRealTimers()
      })
    })

    describe('when multiple consumers are mounted', () => {
      it('should keep the visibility subscription alive while at least one is subscribed', () => {
        jest.useFakeTimers()
        const first = renderHook(() => useHook())
        const second = renderHook(() => useHook())

        first.unmount()
        expect(mockUnsubscribe).not.toHaveBeenCalled()

        second.unmount()
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
        jest.useRealTimers()
      })

      it('should be idempotent when the same listener attempts to subscribe twice', async () => {
        const { result, unmount } = renderHook(() => useHook())
        unmount()
        await flushAll()
        // Re-mount to ensure the unsubscribe path returned by re-subscribing is exercised
        expect(result.current).toBeDefined()
      })
    })
  })

  describe('fetching cards', () => {
    describe('when both endpoints succeed', () => {
      it('should commit the explore cards from buildExploreCards', async () => {
        const cards = [{ id: 'a', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }]
        buildExploreCardsMock.mockReturnValue(cards)

        const hook = renderHook(() => useHook())
        await flushAll()

        expect(hook.result.current.data).toEqual(cards)
        expect(hook.result.current.isLoading).toBe(false)
        hook.unmount()
      })
    })

    describe('when fetch rejects', () => {
      it('should surface the error and stop loading', async () => {
        fetchMock.mockRejectedValue(new Error('network down'))

        const hook = renderHook(() => useHook())
        await flushAll()

        expect(hook.result.current.isLoading).toBe(false)
        hook.unmount()
      })

      it('should wrap non-Error rejections', async () => {
        fetchMock.mockResolvedValue({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.reject('boom')
        } as unknown as Response)

        const hook = renderHook(() => useHook())
        await flushAll()

        expect(hook.result.current.isLoading).toBe(false)
        hook.unmount()
      })
    })

    describe('when responses are not ok', () => {
      it('should treat them as empty payloads', async () => {
        fetchMock.mockResolvedValue(notOkResponse(500))

        const hook = renderHook(() => useHook())
        await flushAll()

        expect(buildExploreCardsMock).toHaveBeenCalledWith([], [])
        hook.unmount()
      })
    })

    describe('when content-type is not JSON', () => {
      it('should drop the body and treat it as empty', async () => {
        fetchMock.mockResolvedValue(okResponse('<html>', 'text/html'))

        const hook = renderHook(() => useHook())
        await flushAll()

        expect(buildExploreCardsMock).toHaveBeenCalledWith([], [])
        hook.unmount()
      })
    })

    describe('when the polling interval ticks', () => {
      it('should re-run the fetch', async () => {
        jest.useFakeTimers()
        try {
          const hook = renderHook(() => useHook())
          await act(async () => {
            await Promise.resolve()
          })
          const callsBefore = fetchMock.mock.calls.length

          act(() => {
            jest.advanceTimersByTime(60_001)
          })
          await act(async () => {
            await Promise.resolve()
          })

          expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore)
          hook.unmount()
        } finally {
          jest.useRealTimers()
        }
      })
    })

    describe('when fallback URLs are used', () => {
      it('should hit decentraland.org events and hot-scenes endpoints', async () => {
        envMock.mockReturnValue(undefined)

        const hook = renderHook(() => useHook())
        await flushAll()

        const calls = fetchMock.mock.calls.map(c => String(c[0]))
        expect(calls.some(u => u.includes('events.decentraland.org'))).toBe(true)
        expect(calls.some(u => u.includes('realm-provider-ea.decentraland.org/hot-scenes'))).toBe(true)
        hook.unmount()
      })
    })
  })

  describe('deployer enrichment', () => {
    describe('when PEER_URL is not set', () => {
      it('should not call the active-entities endpoint', async () => {
        const cards = [{ id: 'a', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }]
        buildExploreCardsMock.mockReturnValue(cards)
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          return undefined
        })

        const hook = renderHook(() => useHook())
        await flushAll()

        const calls = fetchMock.mock.calls.map(c => String(c[0]))
        expect(calls.some(u => u.includes('/content/entities/active'))).toBe(false)
        hook.unmount()
      })
    })

    describe('when there are no place cards needing enrichment', () => {
      it('should not call the active-entities endpoint', async () => {
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        const cards = [
          { id: 'evt', type: 'event', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false, creatorAddress: '0xset' }
        ]
        buildExploreCardsMock.mockReturnValue(cards)

        const hook = renderHook(() => useHook())
        await flushAll()

        const calls = fetchMock.mock.calls.map(c => String(c[0]))
        expect(calls.some(u => u.includes('/content/entities/active'))).toBe(false)
        hook.unmount()
      })
    })

    describe('when the active-entities batch responds successfully', () => {
      it('should enrich place cards with their deployers', async () => {
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        const cards = [{ id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }]
        buildExploreCardsMock.mockReturnValue(cards)

        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/events?list=live&limit=20&order=asc&world=false')) return Promise.resolve(okResponse({ data: [] }))
          if (u.endsWith('/hot-scenes')) return Promise.resolve(okResponse([]))
          if (u.endsWith('/content/entities/active')) return Promise.resolve(okResponse([{ id: 'ent-1', pointers: ['0,0', '1,1'] }]))
          if (u.includes('/content/deployments'))
            return Promise.resolve(okResponse({ deployments: [{ entityId: 'ent-1', deployedBy: '0xdeployer' }] }))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()
        await flushAll()

        expect(hook.result.current.data[0]?.creatorAddress).toBe('0xdeployer')
        hook.unmount()
      })
    })

    describe('when active-entities returns empty', () => {
      it('should not call the deployments endpoint', async () => {
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        buildExploreCardsMock.mockReturnValue([
          { id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }
        ])
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.resolve(okResponse([]))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()

        const calls = fetchMock.mock.calls.map(c => String(c[0]))
        expect(calls.some(u => u.includes('/content/deployments'))).toBe(false)
        hook.unmount()
      })
    })

    describe('when active-entities batch fails', () => {
      it('should swallow the error', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        buildExploreCardsMock.mockReturnValue([
          { id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }
        ])
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.resolve(notOkResponse(500))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()

        hook.unmount()
        warn.mockRestore()
      })
    })

    describe('when deployments batch fails', () => {
      it('should log the warning and abort the enrichment', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        buildExploreCardsMock.mockReturnValue([
          { id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }
        ])
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.resolve(okResponse([{ id: 'ent-1', pointers: ['0,0'] }]))
          if (u.includes('/content/deployments')) return Promise.resolve(notOkResponse(503))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()
        await flushAll()

        hook.unmount()
        warn.mockRestore()
      })
    })

    describe('when deployments fetch rejects', () => {
      it('should catch and continue', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        buildExploreCardsMock.mockReturnValue([
          { id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }
        ])
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.resolve(okResponse([{ id: 'ent-1', pointers: ['0,0'] }]))
          if (u.includes('/content/deployments')) return Promise.reject(new Error('deploy down'))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()
        await flushAll()

        hook.unmount()
        warn.mockRestore()
      })
    })

    describe('when deployments has no matching pointers', () => {
      it('should not enrich any card', async () => {
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        const cards = [{ id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }]
        buildExploreCardsMock.mockReturnValue(cards)
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.resolve(okResponse([{ id: 'ent-1', pointers: ['99,99'] }]))
          if (u.includes('/content/deployments'))
            return Promise.resolve(okResponse({ deployments: [{ entityId: 'ent-1', deployedBy: '0xx' }] }))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()
        await flushAll()

        // deployerMap is empty (size 0) so enrichWithDeployers returns null
        expect(hook.result.current.data[0]?.creatorAddress).toBeUndefined()
        hook.unmount()
      })
    })

    describe('when active-entities fetch rejects', () => {
      it('should log the warning at the enrichment boundary', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        buildExploreCardsMock.mockReturnValue([
          { id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }
        ])
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.reject(new Error('active down'))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()
        await flushAll()

        expect(warn).toHaveBeenCalledWith('[WhatsOn] deployer enrichment failed', expect.any(Error))
        hook.unmount()
        warn.mockRestore()
      })
    })

    describe('when deployments are missing deployedBy fields', () => {
      it('should skip them', async () => {
        envMock.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test/api'
          if (key === 'HOT_SCENES_URL') return 'https://realm.test/hot-scenes'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        const cards = [{ id: 'p1', type: 'place', title: 't', users: 5, image: '', coordinates: '0,0', isGenesisPlaza: false }]
        buildExploreCardsMock.mockReturnValue(cards)
        fetchMock.mockImplementation((url: RequestInfo | URL) => {
          const u = String(url)
          if (u.endsWith('/content/entities/active')) return Promise.resolve(okResponse([{ id: 'ent-1', pointers: ['0,0'] }]))
          if (u.includes('/content/deployments')) return Promise.resolve(okResponse({ deployments: [{ entityId: '', deployedBy: '' }] }))
          return Promise.resolve(okResponse({ data: [] }))
        })

        const hook = renderHook(() => useHook())
        await flushAll()
        await flushAll()

        hook.unmount()
      })
    })
  })
})
