import type { SyntheticEvent } from 'react'
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { isAnalyticsOffForVisitor } from '../modules/analyticsSessionGate'
import { postDeferredClick } from '../modules/deferredClickBeacon'
import { useDeferredTrack } from './useDeferredTrack'
import { useUnloadSafeTrackClick } from './useUnloadSafeTrackClick'

jest.mock('@dcl/hooks', () => ({ useAnalytics: jest.fn() }))
jest.mock('./useDeferredTrack', () => ({ useDeferredTrack: jest.fn() }))
jest.mock('../modules/deferredClickBeacon', () => ({ postDeferredClick: jest.fn() }))
jest.mock('../modules/analyticsSessionGate', () => ({ isAnalyticsOffForVisitor: jest.fn() }))
jest.mock('../modules/campaignParams', () => ({ collectCampaignParams: () => ({}) }))

const element = (tag: 'a' | 'button', attributes: Record<string, string> = {}) => {
  const node = document.createElement(tag)
  node.setAttribute('data-place', 'Creator Fund')
  node.setAttribute('data-section', 'hero-banner')
  node.setAttribute('data-button', 'Join From Creator Hub')
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value))
  return node
}

const click = (currentTarget: HTMLElement, modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) =>
  ({ currentTarget, ...modifiers }) as unknown as SyntheticEvent<HTMLElement>

const expectedPayload = { place: 'Creator Fund', section: 'hero-banner', button: 'Join From Creator Hub' }

describe('useUnloadSafeTrackClick', () => {
  let deferredTrack: jest.Mock

  beforeEach(() => {
    deferredTrack = jest.fn()
    ;(useDeferredTrack as jest.Mock).mockReturnValue(deferredTrack)
    ;(isAnalyticsOffForVisitor as jest.Mock).mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when analytics is ready', () => {
    beforeEach(() => {
      ;(useAnalytics as jest.Mock).mockReturnValue({ isInitialized: true })
    })

    it('should send a Click with the element data through the deferred queue', () => {
      const { result } = renderHook(() => useUnloadSafeTrackClick())

      result.current(click(element('a', { href: '/create' })))

      expect(deferredTrack).toHaveBeenCalledWith('Click', expect.objectContaining(expectedPayload))
      expect(postDeferredClick).not.toHaveBeenCalled()
    })
  })

  describe('when analytics is not ready yet', () => {
    beforeEach(() => {
      ;(useAnalytics as jest.Mock).mockReturnValue({ isInitialized: false })
    })

    it('should send a same-tab navigation through the unload-safe beacon', () => {
      const { result } = renderHook(() => useUnloadSafeTrackClick())

      result.current(click(element('a', { href: '/create' })))

      expect(postDeferredClick).toHaveBeenCalledWith(expect.objectContaining(expectedPayload))
      expect(deferredTrack).not.toHaveBeenCalled()
    })

    it.each([
      ['an in-page anchor', element('a', { href: '#join' }), {}],
      ['a mailto link', element('a', { href: 'mailto:creatorfund@decentraland.org' }), {}],
      ['a new-tab link', element('a', { href: 'https://docs.decentraland.org', target: '_blank' }), {}],
      ['a modified click', element('a', { href: '/create' }), { metaKey: true }],
      ['a button', element('button'), {}]
    ])('should queue %s, since the page stays', (_label, node, modifiers) => {
      const { result } = renderHook(() => useUnloadSafeTrackClick())

      result.current(click(node, modifiers))

      expect(deferredTrack).toHaveBeenCalledWith('Click', expect.objectContaining(expectedPayload))
      expect(postDeferredClick).not.toHaveBeenCalled()
    })

    it('should drop a click that stays on the page when analytics never boots for this visitor', () => {
      ;(isAnalyticsOffForVisitor as jest.Mock).mockReturnValue(true)
      const { result } = renderHook(() => useUnloadSafeTrackClick())

      result.current(click(element('a', { href: '#join' })))

      expect(deferredTrack).not.toHaveBeenCalled()
      expect(postDeferredClick).not.toHaveBeenCalled()
    })
  })
})
