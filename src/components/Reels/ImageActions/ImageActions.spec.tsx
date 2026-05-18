import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { withMockFetch } from '../../../__test-utils__/withMockFetch'
import { ImageActions } from './ImageActions'

const trackMock = jest.fn()
const buildTwitterShareUrlMock = jest.fn((_description: string, _url: string) => 'https://twitter.com/intent/tweet?fake=1')

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock, isInitialized: true })
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  styled: (tag: string) => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const Component = (tag || 'div') as keyof JSX.IntrinsicElements
    return <Component {...(props as object)}>{props.children}</Component>
  }
}))

jest.mock('@mui/icons-material/X', () => {
  const Mock = () => <span data-testid="reels-x-icon" />
  return { __esModule: true, default: Mock }
})

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
      fireEvent.click(screen.getByRole('button', { name: 'component.reels.image_actions.share' }))
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

  describe('when keyboard activation is used', () => {
    it('should trigger share, copy, download, and info actions on Enter', async () => {
      const onToggle = jest.fn()
      const fetchMock = jest.fn().mockResolvedValue({ blob: async () => new Blob(['x']) })
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalCreate = URL.createObjectURL
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalRevoke = URL.revokeObjectURL
      URL.createObjectURL = jest.fn(() => 'blob:fake')
      URL.revokeObjectURL = jest.fn()
      try {
        await withMockFetch(fetchMock, async () => {
          render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={onToggle} />)

          fireEvent.keyDown(screen.getByRole('button', { name: 'component.reels.image_actions.share' }), { key: 'Enter' })
          expect(window.open).toHaveBeenCalled()

          fireEvent.keyDown(screen.getByAltText('component.reels.image_actions.copy_link'), { key: 'Enter' })
          await waitFor(() => expect(writeTextMock).toHaveBeenCalled())

          fireEvent.keyDown(screen.getByAltText('component.reels.image_actions.download'), { key: 'Enter' })
          await waitFor(() => expect(fetchMock).toHaveBeenCalled())

          fireEvent.keyDown(screen.getByAltText('component.reels.image_actions.info'), { key: 'Enter' })
          expect(onToggle).toHaveBeenCalled()

          // Non-Enter keys should not re-trigger handlers.
          const callsBefore = (window.open as jest.Mock).mock.calls.length
          fireEvent.keyDown(screen.getByRole('button', { name: 'component.reels.image_actions.share' }), { key: 'Space' })
          expect((window.open as jest.Mock).mock.calls.length).toBe(callsBefore)
        })
      } finally {
        URL.createObjectURL = originalCreate
        URL.revokeObjectURL = originalRevoke
      }
    })
  })

  describe('when the download action runs', () => {
    it('should fetch the image, build an anchor element, and revoke the object URL', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ blob: async () => new Blob(['x']) })
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalCreate = URL.createObjectURL
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalRevoke = URL.revokeObjectURL
      URL.createObjectURL = jest.fn(() => 'blob:fake')
      URL.revokeObjectURL = jest.fn()
      try {
        await withMockFetch(fetchMock, async () => {
          render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} />)
          fireEvent.click(screen.getByAltText('component.reels.image_actions.download'))
          await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(fakeImage.url))
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(URL.createObjectURL).toHaveBeenCalled()
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(URL.revokeObjectURL).toHaveBeenCalled()
          expect(trackMock).toHaveBeenCalledWith('Reels Download', { imageId: 'img-1' })
        })
      } finally {
        URL.createObjectURL = originalCreate
        URL.revokeObjectURL = originalRevoke
      }
    })

    it('should fall back to the literal "photo" filename when no visible person is recorded', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ blob: async () => new Blob(['x']) })
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalCreate = URL.createObjectURL
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalRevoke = URL.revokeObjectURL
      URL.createObjectURL = jest.fn(() => 'blob:fake')
      URL.revokeObjectURL = jest.fn()
      const anchorClick = jest.fn()
      const realCreate = document.createElement.bind(document)
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = realCreate(tag)
        if (tag === 'a') (el as HTMLAnchorElement).click = anchorClick
        return el
      })
      try {
        await withMockFetch(fetchMock, async () => {
          const imageWithoutPeople = {
            ...fakeImage,
            metadata: { ...fakeImage.metadata, visiblePeople: [] }
          }
          render(<ImageActions image={imageWithoutPeople} metadataVisible={false} onToggleMetadata={jest.fn()} />)
          fireEvent.click(screen.getByAltText('component.reels.image_actions.download'))
          await waitFor(() => expect(anchorClick).toHaveBeenCalled())
        })
      } finally {
        URL.createObjectURL = originalCreate
        URL.revokeObjectURL = originalRevoke
        ;(document.createElement as jest.Mock).mockRestore?.()
      }
    })

    it('should swallow fetch failures', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      try {
        await withMockFetch(jest.fn().mockRejectedValue(new Error('net')), async () => {
          render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} />)
          fireEvent.click(screen.getByAltText('component.reels.image_actions.download'))
          await waitFor(() => expect(warn).toHaveBeenCalled())
        })
      } finally {
        warn.mockRestore()
      }
    })
  })

  describe('when copy link fails', () => {
    it('should swallow the clipboard rejection', async () => {
      writeTextMock.mockRejectedValueOnce(new Error('denied'))
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      try {
        render(<ImageActions image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} />)
        fireEvent.click(screen.getByAltText('component.reels.image_actions.copy_link'))
        await waitFor(() => expect(warn).toHaveBeenCalled())
      } finally {
        warn.mockRestore()
      }
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
