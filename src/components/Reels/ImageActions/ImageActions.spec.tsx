import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ImageActions } from './ImageActions'

const trackMock = jest.fn()
const buildTwitterShareUrlMock = jest.fn((_description: string, _url: string) => 'https://twitter.com/intent/tweet?fake=1')

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock, isInitialized: true })
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  styled: () => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const { children, ...rest } = props
    return <div {...(rest as object)}>{children}</div>
  }
}))

jest.mock('../../../features/reels', () => ({
  buildTwitterShareUrl: (description: string, url: string) => buildTwitterShareUrlMock(description, url)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const fakeImage = {
  id: 'img-1',
  url: 'https://image.url/blob',
  thumbnailUrl: '',
  metadata: {
    userName: 'alice',
    userAddress: '0xa',
    dateTime: '2026-05-01T12:00:00Z',
    realm: '',
    scene: { name: 'plaza', location: { x: '0', y: '0' } },
    visiblePeople: [{ userName: 'alice', userAddress: '0xa', isGuest: false, wearables: [] }]
  }
}

describe('ImageActions', () => {
  const originalOpen = window.open
  const originalLocation = window.location
  const writeTextMock = jest.fn().mockResolvedValue(undefined)

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: 'https://reels.example/img-1' }
    })
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: writeTextMock }
    })
  })

  beforeEach(() => {
    trackMock.mockReset()
    buildTwitterShareUrlMock.mockClear()
    writeTextMock.mockClear()
    window.open = jest.fn()
  })

  afterAll(() => {
    window.open = originalOpen
  })

  describe('when the share button is clicked', () => {
    it('should open the Twitter intent and track the event', () => {
      render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} />)
      fireEvent.click(screen.getByAltText('component.reels.image_actions.share'))
      expect(window.open).toHaveBeenCalledWith('https://twitter.com/intent/tweet?fake=1', '_blank', 'noopener,noreferrer')
      expect(trackMock).toHaveBeenCalledWith('Reels Share', { imageId: 'img-1' })
    })
  })

  describe('when the copy link button is clicked', () => {
    it('should write the current URL to clipboard and track the event', async () => {
      render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} />)
      fireEvent.click(screen.getByAltText('component.reels.image_actions.copy_link'))
      await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith('https://reels.example/img-1'))
      expect(trackMock).toHaveBeenCalledWith('Reels Copy Link', { imageId: 'img-1' })
    })
  })

  describe('when the info button is clicked', () => {
    it('should fire SHOW event and call onToggleMetadata when metadata is hidden', () => {
      const onToggle = jest.fn()
      render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={onToggle} />)
      fireEvent.click(screen.getByAltText('component.reels.image_actions.info'))
      expect(onToggle).toHaveBeenCalledTimes(1)
      expect(trackMock).toHaveBeenCalledWith('Reels Show Metadata', { imageId: 'img-1' })
    })

    it('should fire HIDE event when metadata is visible', () => {
      const onToggle = jest.fn()
      render(<ImageActions image={fakeImage} metadataVisible={true} onToggleMetadata={onToggle} />)
      fireEvent.click(screen.getByAltText('component.reels.image_actions.info'))
      expect(trackMock).toHaveBeenCalledWith('Reels Hide Metadata', { imageId: 'img-1' })
    })
  })
})
