import { renderHook } from '@testing-library/react'
import type { DownloadFunnelExitData } from '../modules/downloadFunnelExit.types'
import { useDownloadFunnelExit } from './useDownloadFunnelExit'

const mockSend = jest.fn()
jest.mock('../modules/downloadFunnelExit', () => ({
  sendDownloadFunnelExit: (...args: unknown[]) => mockSend(...args)
}))

const setVisibility = (hidden: boolean): void => {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  Object.defineProperty(document, 'visibilityState', { value: hidden ? 'hidden' : 'visible', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

const exitData = (overrides: Partial<DownloadFunnelExitData> = {}): DownloadFunnelExitData => ({
  os: 'macOS',
  arch: 'arm64',
  place: 'download-page',
  anonUserId: 'anon-9',
  startedFired: true,
  successFired: true,
  failedFired: false,
  msOnPage: 500,
  revisit: 0,
  authState: 'authenticated',
  ...overrides
})

describe('useDownloadFunnelExit', () => {
  afterEach(() => {
    jest.resetAllMocks()
    setVisibility(false)
  })

  it('should send the exit event with the latest snapshot when the page is hidden', () => {
    const data = exitData()
    renderHook(() => useDownloadFunnelExit(() => data))

    setVisibility(true)

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith(data)
  })

  it('should read the snapshot at fire time, not at mount time', () => {
    let started = false
    const { rerender } = renderHook(() => useDownloadFunnelExit(() => exitData({ startedFired: started })))

    started = true
    rerender()
    setVisibility(true)

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ startedFired: true }))
  })

  it('should not send when the page becomes visible', () => {
    renderHook(() => useDownloadFunnelExit(() => exitData()))

    setVisibility(false)

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('should send again on a later hide (dedup is handled in the warehouse)', () => {
    renderHook(() => useDownloadFunnelExit(() => exitData()))

    setVisibility(true) // switch away
    setVisibility(false) // come back
    setVisibility(true) // leave

    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('should detach the listener on unmount', () => {
    const { unmount } = renderHook(() => useDownloadFunnelExit(() => exitData()))

    unmount()
    setVisibility(true)

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('should not subscribe when disabled', () => {
    renderHook(() => useDownloadFunnelExit(() => exitData(), false))

    setVisibility(true)

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('should start sending once enabled flips true', () => {
    let enabled = false
    const { rerender } = renderHook(() => useDownloadFunnelExit(() => exitData(), enabled))

    setVisibility(true)
    expect(mockSend).not.toHaveBeenCalled()

    enabled = true
    rerender()
    setVisibility(false)
    setVisibility(true)
    expect(mockSend).toHaveBeenCalledTimes(1)
  })
})
