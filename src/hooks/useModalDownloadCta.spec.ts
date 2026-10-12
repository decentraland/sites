import { renderHook } from '@testing-library/react'
import { detectDesktopInstallerOs } from '../modules/downloadConstants'
import { buildModalDownloadUrl } from '../modules/url'
import { OperativeSystem } from '../types/download.types'
import { useModalDownloadCta } from './useModalDownloadCta'

const mockTrackDownloadClick = jest.fn()
jest.mock('./useDownloadClick', () => ({ useDownloadClick: () => mockTrackDownloadClick }))
jest.mock('../modules/downloadConstants', () => ({ detectDesktopInstallerOs: jest.fn() }))
jest.mock('../modules/url', () => ({ buildModalDownloadUrl: jest.fn() }))

const mockedDetectInstallerOs = detectDesktopInstallerOs as jest.MockedFunction<typeof detectDesktopInstallerOs>
const mockedBuildModalDownloadUrl = buildModalDownloadUrl as jest.MockedFunction<typeof buildModalDownloadUrl>

const DIRECT_URL = 'http://localhost/download_success?os=Windows&place=download-modal'

const clickOn = (button: HTMLAnchorElement, modifiers: Partial<Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'button'>> = {}) =>
  ({
    currentTarget: button,
    preventDefault: jest.fn(),
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    button: 0,
    ...modifiers
  }) as unknown as React.MouseEvent<HTMLElement> & { preventDefault: jest.Mock }

describe('useModalDownloadCta', () => {
  let assignSpy: jest.Mock

  beforeEach(() => {
    assignSpy = jest.fn()
    Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, assign: assignSpy } })
    mockedBuildModalDownloadUrl.mockImplementation((os, base) => (os ? DIRECT_URL : base))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the browser has a desktop installer', () => {
    beforeEach(() => {
      mockedDetectInstallerOs.mockReturnValue(OperativeSystem.WINDOWS)
    })

    it('should build the direct download URL from the detected OS and the params', () => {
      const params = { anon_user_id: 'anon-1' }
      const { result } = renderHook(() => useModalDownloadCta('/download', params))

      expect(mockedBuildModalDownloadUrl).toHaveBeenCalledWith(OperativeSystem.WINDOWS, '/download', params)
      expect(result.current.downloadUrl).toBe(DIRECT_URL)
    })

    it('should track the click as a modal desktop download and navigate in the same tab', () => {
      const { result } = renderHook(() => useModalDownloadCta('/download', {}))
      const button = document.createElement('a')
      const event = clickOn(button)

      result.current.onDownloadClick?.(event)

      expect(button.dataset).toMatchObject({
        event: 'Download',
        place: 'download-modal',
        downloadTarget: 'desktop_installer',
        os: 'Windows'
      })
      expect(mockTrackDownloadClick).toHaveBeenCalledWith(event)
      expect(event.preventDefault).toHaveBeenCalled()
      expect(assignSpy).toHaveBeenCalledWith(DIRECT_URL)
    })

    describe.each([
      ['cmd', { metaKey: true }],
      ['ctrl', { ctrlKey: true }],
      ['shift', { shiftKey: true }],
      ['non-primary button', { button: 1 }]
    ])('and the click is a %s click', (_name, modifiers) => {
      it('should leave the click to the browser', () => {
        const { result } = renderHook(() => useModalDownloadCta('/download', {}))
        const event = clickOn(document.createElement('a'), modifiers)

        result.current.onDownloadClick?.(event)

        expect(event.preventDefault).not.toHaveBeenCalled()
        expect(mockTrackDownloadClick).not.toHaveBeenCalled()
        expect(assignSpy).not.toHaveBeenCalled()
      })
    })

    it('should do nothing when called without a click event', () => {
      const { result } = renderHook(() => useModalDownloadCta('/download', {}))

      result.current.onDownloadClick?.()

      expect(mockTrackDownloadClick).not.toHaveBeenCalled()
      expect(assignSpy).not.toHaveBeenCalled()
    })
  })

  describe('when there is no desktop installer for the browser', () => {
    beforeEach(() => {
      mockedDetectInstallerOs.mockReturnValue(null)
    })

    it('should keep the fallback URL and leave the click to the modal link', () => {
      const { result } = renderHook(() => useModalDownloadCta('/download', {}))

      expect(result.current.downloadUrl).toBe('/download')
      expect(result.current.onDownloadClick).toBeUndefined()
    })
  })
})
