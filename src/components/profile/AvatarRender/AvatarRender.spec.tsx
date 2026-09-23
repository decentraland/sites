import { act, render, screen } from '@testing-library/react'
import { PreviewUnityMode } from '@dcl/schemas'
import { AvatarRender } from './AvatarRender'

const mockWearablePreviewProps = jest.fn()
const mockUseProfileAvatar = jest.fn()
const mockGetEnv = jest.fn()

jest.mock('decentraland-ui2', () => {
  const styledMock = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...styledMock,
    WearablePreview: (props: Record<string, unknown>) => {
      mockWearablePreviewProps(props)
      return <div data-testid="wearable-preview" />
    },
    CircularProgress: () => <div data-testid="avatar-loader" />
  }
})

jest.mock('../../../config/env', () => ({
  getEnv: (key: string) => mockGetEnv(key)
}))

jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: (address: string | undefined) => mockUseProfileAvatar(address)
}))

const ADDRESS = '0xd9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd'
const BODY_SNAPSHOT = 'https://peer.decentraland.org/content/contents/body.png'

function lastPreviewProps(): Record<string, unknown> {
  return mockWearablePreviewProps.mock.calls.at(-1)?.[0] ?? {}
}

describe('AvatarRender', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue('https://wearable-preview.decentraland.org/')
    mockUseProfileAvatar.mockReturnValue({
      avatar: { avatar: { snapshots: { body: BODY_SNAPSHOT } } },
      backgroundColor: '#ff2d55'
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering the preview', () => {
    it('should enable the Unity renderer so it matches the Marketplace preview', () => {
      render(<AvatarRender address={ADDRESS} />)
      expect(lastPreviewProps()).toEqual(expect.objectContaining({ unity: true }))
    })

    it('should render the preview in the profile Unity mode', () => {
      render(<AvatarRender address={ADDRESS} />)
      expect(lastPreviewProps()).toEqual(expect.objectContaining({ unityMode: PreviewUnityMode.PROFILE }))
    })

    it('should drive the preview off the lowercased address', () => {
      render(<AvatarRender address={ADDRESS} />)
      expect(lastPreviewProps()).toEqual(expect.objectContaining({ profile: ADDRESS.toLowerCase() }))
    })

    it('should resolve the base url from the WEARABLE_PREVIEW_URL env key, stripping the trailing slash', () => {
      render(<AvatarRender address={ADDRESS} />)
      expect(mockGetEnv).toHaveBeenCalledWith('WEARABLE_PREVIEW_URL')
      expect(lastPreviewProps()).toEqual(expect.objectContaining({ baseUrl: 'https://wearable-preview.decentraland.org' }))
    })

    it('should show the loader until the preview reports it has loaded', () => {
      render(<AvatarRender address={ADDRESS} />)
      expect(screen.getByTestId('avatar-loader')).toBeInTheDocument()

      act(() => {
        ;(lastPreviewProps().onLoad as () => void)()
      })

      expect(screen.queryByTestId('avatar-loader')).not.toBeInTheDocument()
    })
  })

  describe('when the preview fails to load', () => {
    it('should fall back to the body snapshot image', () => {
      render(<AvatarRender address={ADDRESS} />)

      act(() => {
        ;(lastPreviewProps().onError as (error: Error) => void)(new Error('boom'))
      })

      expect(screen.queryByTestId('wearable-preview')).not.toBeInTheDocument()
      expect(screen.getByAltText('Avatar')).toHaveAttribute('src', BODY_SNAPSHOT)
    })

    it('should render nothing extra when there is no body snapshot to fall back to', () => {
      mockUseProfileAvatar.mockReturnValue({ avatar: undefined, backgroundColor: '#ff2d55' })
      render(<AvatarRender address={ADDRESS} />)

      act(() => {
        ;(lastPreviewProps().onError as (error: Error) => void)(new Error('boom'))
      })

      expect(screen.queryByTestId('wearable-preview')).not.toBeInTheDocument()
      expect(screen.queryByAltText('Avatar')).not.toBeInTheDocument()
    })
  })
})
