import { renderHook } from '@testing-library/react'
import type { DownloadFunnelExitData } from '../modules/downloadFunnelExit.types'
import { useDownloadFunnelExit } from './useDownloadFunnelExit'

const mockSend = jest.fn()
jest.mock('../modules/downloadFunnelExit', () => ({
  sendDownloadFunnelExit: (...args: unknown[]) => mockSend(...args)
}))

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
  })

  it('should send the exit event with the latest snapshot on pagehide', () => {
    const data = exitData()
    renderHook(() => useDownloadFunnelExit(() => data))

    window.dispatchEvent(new Event('pagehide'))

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith(data)
  })

  it('should read the snapshot at fire time, not at mount time', () => {
    let started = false
    const { rerender } = renderHook(() => useDownloadFunnelExit(() => exitData({ startedFired: started })))

    started = true
    rerender()
    window.dispatchEvent(new Event('pagehide'))

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ startedFired: true }))
  })

  it('should fire only once across repeated pagehide events', () => {
    renderHook(() => useDownloadFunnelExit(() => exitData()))

    window.dispatchEvent(new Event('pagehide'))
    window.dispatchEvent(new Event('pagehide'))

    expect(mockSend).toHaveBeenCalledTimes(1)
  })

  it('should detach the listener on unmount', () => {
    const { unmount } = renderHook(() => useDownloadFunnelExit(() => exitData()))

    unmount()
    window.dispatchEvent(new Event('pagehide'))

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('should not subscribe when disabled', () => {
    renderHook(() => useDownloadFunnelExit(() => exitData(), false))

    window.dispatchEvent(new Event('pagehide'))

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('should start sending once enabled flips true', () => {
    let enabled = false
    const { rerender } = renderHook(() => useDownloadFunnelExit(() => exitData(), enabled))

    window.dispatchEvent(new Event('pagehide'))
    expect(mockSend).not.toHaveBeenCalled()

    enabled = true
    rerender()
    window.dispatchEvent(new Event('pagehide'))
    expect(mockSend).toHaveBeenCalledTimes(1)
  })
})
