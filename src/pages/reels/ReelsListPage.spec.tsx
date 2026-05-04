import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { ReelsListPage } from './ReelsListPage'

const useReelImagesByUserMock = jest.fn()
const trackMock = jest.fn()
const navigateMock = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock
}))

jest.mock('../../hooks/useReelImagesByUser', () => ({
  useReelImagesByUser: (address: string | undefined, options: unknown) => useReelImagesByUserMock(address, options)
}))

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock, isInitialized: true })
}))

jest.mock('../../components/Reels/NotPhoto', () => ({
  NotPhoto: () => <div data-testid="reels-not-photo" />
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  Typography: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <p {...(props as object)}>{children}</p>
  ),
  styled: () => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const { children, ...rest } = props
    return <div {...(rest as object)}>{children}</div>
  }
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, values?: Record<string, string>) => `${key}:${values?.userName ?? ''}`
}))

const renderWithRouter = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reels/list/:address" element={<ReelsListPage />} />
      </Routes>
    </MemoryRouter>
  )

describe('ReelsListPage', () => {
  beforeEach(() => {
    useReelImagesByUserMock.mockReset()
    trackMock.mockReset()
    navigateMock.mockReset()
  })

  describe('when there are no images', () => {
    it('should render NotPhoto', () => {
      useReelImagesByUserMock.mockReturnValue({ images: [], total: 0, isLoading: false, error: null })
      renderWithRouter('/reels/list/0xa')
      expect(screen.getByTestId('reels-not-photo')).toBeInTheDocument()
    })
  })

  describe('when there are images', () => {
    const sampleImages = [
      {
        id: 'img-1',
        url: 'u1',
        thumbnailUrl: 't1',
        metadata: { visiblePeople: [{ userName: 'alice' }] }
      },
      {
        id: 'img-2',
        url: 'u2',
        thumbnailUrl: 't2',
        metadata: { visiblePeople: [{ userName: 'alice' }] }
      }
    ]

    it('should render an item per image', () => {
      useReelImagesByUserMock.mockReturnValue({ images: sampleImages, total: 2, isLoading: false, error: null })
      renderWithRouter('/reels/list/0xa')
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })

    it('should navigate to /reels/:imageId and track on click', () => {
      useReelImagesByUserMock.mockReturnValue({ images: sampleImages, total: 2, isLoading: false, error: null })
      renderWithRouter('/reels/list/0xa')
      fireEvent.click(screen.getAllByRole('button')[0])
      expect(navigateMock).toHaveBeenCalledWith('/reels/img-1')
      expect(trackMock).toHaveBeenCalledWith('Reels Click Thumbnail', { imageId: 'img-1' })
    })
  })
})
