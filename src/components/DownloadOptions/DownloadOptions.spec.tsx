import { fireEvent, render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAnonUserId } from '../../hooks/useAnonUserId'
import { useDownloadClick } from '../../hooks/useDownloadClick'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import { DownloadPlace } from '../../modules/segment'
import { OperativeSystem } from '../../types/download.types'
import { DownloadOptions } from './DownloadOptions'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  const Button = ({ children, startIcon, ...rest }: { children?: React.ReactNode; startIcon?: React.ReactNode }) => (
    <a {...rest}>
      {startIcon}
      {children}
    </a>
  )
  return {
    styled,
    Box,
    Button,
    Typography,
    dclColors: {
      neutral: { white: '#FFFFFF', trueWhite: '#FFFFFF', softWhite: '#FCFCFC', softBlack2: '#242129' },
      brand: { ruby: '#FF2D55' },
      whiteTransparent: { soft: 'rgba(255, 255, 255, 0.2)', backdrop: 'rgba(255, 255, 255, 0.6)' }
    }
  }
})

jest.mock('decentraland-ui2/dist/modules/cdnReleases', () => ({
  CDNSource: { LAUNCHER: 'launcher' },
  getCDNRelease: jest.fn()
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn(),
  useAsyncMemo: jest.fn()
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: jest.fn()
}))

jest.mock('../../hooks/useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anon_user_id',
  useAnonUserId: jest.fn()
}))

jest.mock('../../hooks/useDownloadClick', () => ({
  useDownloadClick: jest.fn()
}))

jest.mock('../../hooks/useGetIdentityId', () => ({
  useGetIdentityId: jest.fn()
}))

jest.mock('../../modules/explorerDownloads', () => ({
  ExplorerDownloads: { get: jest.fn(() => ({ getTotalDownloads: jest.fn().mockResolvedValue(500000) })) }
}))

jest.mock('../../modules/url', () => ({
  buildDownloadSuccessHref: (os: string, place: string, options?: { anonUserId?: string; arch?: string }) => {
    const params = new URLSearchParams({ os, place })
    if (options?.anonUserId) params.set('anon_user_id', options.anonUserId)
    if (options?.arch) params.set('arch', options.arch)
    return `/download_success?${params.toString()}`
  },
  sanitizeCDNReleaseLinks: (links: Record<string, Record<string, string | undefined>> | null) => links
}))

jest.mock('../Icon/VerifiedIcon', () => ({
  VerifiedIcon: () => <span data-testid="verified-icon" />
}))

const mockUserAgent = jest.mocked(useAdvancedUserAgentData)
const mockAsyncMemo = jest.mocked(useAsyncMemo)
const mockFormatMessage = jest.mocked(useFormatMessage)
const mockAnonUserId = jest.mocked(useAnonUserId)
const mockDownloadClick = jest.mocked(useDownloadClick)
const mockGetIdentityId = jest.mocked(useGetIdentityId)
const mockGetCDNRelease = jest.mocked(getCDNRelease)

const trackDownloadClick = jest.fn()
const getIdentityId = jest.fn()
const originalLocation = window.location

const setLocationMock = () => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: '' }
  })
}

describe('DownloadOptions', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockFormatMessage.mockReturnValue((id?: string | null) => id ?? '')
    mockAnonUserId.mockReturnValue('anon-123')
    mockDownloadClick.mockReturnValue(trackDownloadClick)
    mockGetIdentityId.mockReturnValue(getIdentityId)
    mockAsyncMemo.mockReturnValue([500000, { loading: false, loaded: true }] as unknown as ReturnType<typeof useAsyncMemo>)
    mockUserAgent.mockReturnValue([
      false,
      { os: { name: OperativeSystem.WINDOWS }, cpu: { architecture: 'amd64' }, mobile: false }
    ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    mockGetCDNRelease.mockReturnValue({
      Windows: { amd64: 'https://cdn.example.com/decentraland.exe' },
      macOS: { amd64: 'https://cdn.example.com/decentraland.dmg', arm64: 'https://cdn.example.com/decentraland.dmg' }
    })
    setLocationMock()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
  })

  describe('when clicking the primary download option', () => {
    it('should redirect to download_success with os, place, anon_user_id, and arch', () => {
      render(<DownloadOptions />)

      fireEvent.click(screen.getByText('page.download.download_for_short'))
      jest.runOnlyPendingTimers()

      const url = new URL(window.location.href, 'https://decentraland.org')
      expect([
        url.pathname,
        url.searchParams.get('os'),
        url.searchParams.get('place'),
        url.searchParams.get('anon_user_id'),
        url.searchParams.get('arch')
      ]).toEqual(['/download_success', OperativeSystem.WINDOWS, DownloadPlace.DOWNLOAD_PAGE, 'anon-123', 'amd64'])
    })
  })
})
