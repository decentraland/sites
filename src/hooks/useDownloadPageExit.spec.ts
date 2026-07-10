import { renderHook } from '@testing-library/react'
import { resetDownloadCtaClicked, sendDownloadPageExit } from '../modules/downloadPageExit'
import { useDownloadPageExit } from './useDownloadPageExit'

jest.mock('../modules/downloadPageExit', () => ({
  resetDownloadCtaClicked: jest.fn(),
  sendDownloadPageExit: jest.fn()
}))

const setVisibility = (hidden: boolean): void => {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  Object.defineProperty(document, 'visibilityState', { value: hidden ? 'hidden' : 'visible', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('when the download page exit hook is mounted', () => {
  afterEach(() => {
    setVisibility(false)
    jest.resetAllMocks()
  })

  it('should reset the CTA flag on mount', () => {
    renderHook(() => useDownloadPageExit())
    expect(resetDownloadCtaClicked).toHaveBeenCalled()
  })

  it('should send the exit snapshot with the elapsed ms when the page hides', () => {
    renderHook(() => useDownloadPageExit())
    setVisibility(true)
    expect(sendDownloadPageExit).toHaveBeenCalledWith(expect.any(Number))
  })

  it('should not send anything while the page stays visible', () => {
    renderHook(() => useDownloadPageExit())
    expect(sendDownloadPageExit).not.toHaveBeenCalled()
  })

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useDownloadPageExit())
    unmount()
    setVisibility(true)
    expect(sendDownloadPageExit).not.toHaveBeenCalled()
  })
})
