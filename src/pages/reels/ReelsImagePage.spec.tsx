import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { ReelsImagePage } from './ReelsImagePage'

const useReelImageByIdMock = jest.fn()
const metadataVisibleSpy = jest.fn()

jest.mock('../../hooks/useReelImageById', () => ({
  useReelImageById: (id: string | undefined) => useReelImageByIdMock(id)
}))

jest.mock('../../components/Reels/ImageViewer', () => ({
  ImageViewer: ({ onToggleMetadata }: { onToggleMetadata: () => void }) => (
    <button data-testid="reels-image-viewer" onClick={onToggleMetadata} />
  )
}))

jest.mock('../../components/Reels/Metadata', () => ({
  Metadata: ({ visible }: { visible: boolean }) => {
    metadataVisibleSpy(visible)
    return <div data-testid="reels-metadata-panel" />
  }
}))

jest.mock('../../components/Reels/NotPhoto', () => ({
  NotPhoto: () => <div data-testid="reels-not-photo" />
}))

jest.mock('../../hooks/usePageView', () => ({
  usePageView: () => {}
}))

const renderWithRouter = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reels/:imageId" element={<ReelsImagePage />} />
      </Routes>
    </MemoryRouter>
  )

const fakeImage = {
  id: 'abc',
  url: 'https://image/abc.jpg',
  thumbnailUrl: 't',
  metadata: {
    userName: 'alice',
    userAddress: '0xa',
    dateTime: '2026-05-01T12:00:00Z',
    realm: '',
    scene: { name: 'Plaza', location: { x: '0', y: '0' } },
    visiblePeople: [{ userName: 'alice', userAddress: '0xa', isGuest: false, wearables: [] }]
  }
}

describe('ReelsImagePage', () => {
  beforeEach(() => useReelImageByIdMock.mockReset())

  describe('when the image is not found', () => {
    it('should render NotPhoto', () => {
      useReelImageByIdMock.mockReturnValue({ image: null, isLoading: false, error: new Error('not found') })
      renderWithRouter('/reels/missing')
      expect(screen.getByTestId('reels-not-photo')).toBeInTheDocument()
    })
  })

  describe('when the image is available', () => {
    it('should render ImageViewer and Metadata', () => {
      useReelImageByIdMock.mockReturnValue({ image: fakeImage, isLoading: false, error: null })
      renderWithRouter('/reels/abc')
      expect(screen.getByTestId('reels-image-viewer')).toBeInTheDocument()
      expect(screen.getByTestId('reels-metadata-panel')).toBeInTheDocument()
    })

    it('should set the document title using user and scene', () => {
      useReelImageByIdMock.mockReturnValue({ image: fakeImage, isLoading: false, error: null })
      renderWithRouter('/reels/abc')
      expect(document.title).toBe('alice took this photo in Plaza')
    })

    it('should toggle metadata visibility when the viewer requests it', () => {
      useReelImageByIdMock.mockReturnValue({ image: fakeImage, isLoading: false, error: null })
      renderWithRouter('/reels/abc')

      expect(metadataVisibleSpy).toHaveBeenLastCalledWith(true)

      fireEvent.click(screen.getByTestId('reels-image-viewer'))

      expect(metadataVisibleSpy).toHaveBeenLastCalledWith(false)
    })
  })

  describe('when initially loading', () => {
    it('should render nothing until data resolves', () => {
      useReelImageByIdMock.mockReturnValue({ image: null, isLoading: true, error: null })
      const { container } = renderWithRouter('/reels/abc')
      expect(container.firstChild).toBeNull()
    })
  })
})
