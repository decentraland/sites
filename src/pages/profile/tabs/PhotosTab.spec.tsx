import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import { PhotosTab } from './PhotosTab'

jest.mock('@mui/icons-material/ImageOutlined', () => ({
  __esModule: true,
  default: () => mockReact.createElement('span', { 'data-icon': 'image' })
}))
jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Typography: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children)
}))
jest.mock('./OverviewTab.styled', () => ({
  EmptyBio: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children),
  LoadingRow: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))
jest.mock('./PhotosTab.styled', () => ({
  PhotosGrid: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  PhotoCard: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
    mockReact.createElement('button', { onClick }, children),
  PhotoImage: ({ src, alt }: { src?: string; alt?: string }) => mockReact.createElement('img', { src, alt })
}))
const openPhotoMock = jest.fn()
jest.mock('../../../components/profile/PhotoModal', () => ({
  PhotoModal: ({ imageId }: { imageId: string | null }) =>
    mockReact.createElement('div', { 'data-testid': 'photo-modal', 'data-open-id': imageId ?? '' })
}))
jest.mock('../../../components/profile/ProfileModal/useOpenPhotoModal', () => ({
  useOpenPhotoModal: () => ({ openImageId: null, open: openPhotoMock, close: jest.fn() })
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
jest.mock('../../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => ({ identity: undefined }) }))
jest.mock('../../../hooks/useReelImagesByUser', () => ({ useReelImagesByUser: jest.fn() }))
jest.mock('../../../components/profile/ProfileEmptyState', () => ({
  JumpInEmptyState: ({ title, subtitle, ctaLabel }: { title: string; subtitle?: string; ctaLabel: string }) =>
    mockReact.createElement(
      'div',
      { 'data-testid': 'empty-state' },
      mockReact.createElement('p', null, title),
      subtitle ? mockReact.createElement('p', null, subtitle) : null,
      mockReact.createElement('button', null, ctaLabel)
    )
}))

const mockedReels = useReelImagesByUser as jest.MockedFunction<typeof useReelImagesByUser>
const ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

describe('PhotosTab', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there are no photos', () => {
    beforeEach(() => {
      mockedReels.mockReturnValue({ images: [], isLoading: false } as unknown as ReturnType<typeof useReelImagesByUser>)
    })

    it('should render the rich empty state with a jump-in CTA on the own profile', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('profile.photos.empty_title')).toBeInTheDocument()
      expect(screen.getByText('profile.photos.empty_owner_cta')).toBeInTheDocument()
    })

    it('should render the plain member message without a CTA on a member profile', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.queryByTestId('empty-state')).toBeNull()
      expect(screen.getByText('profile.photos.empty_member')).toBeInTheDocument()
    })
  })

  describe('when photos are loading', () => {
    beforeEach(() => {
      mockedReels.mockReturnValue({ images: [], isLoading: true } as unknown as ReturnType<typeof useReelImagesByUser>)
    })

    it('should render a loading spinner', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when there are photos', () => {
    beforeEach(() => {
      mockedReels.mockReturnValue({
        isLoading: false,
        images: [
          {
            id: 'img-1',
            thumbnailUrl: 'https://reels.test/thumb-1.jpg',
            url: 'https://reels.test/full-1.jpg',
            metadata: { scene: { name: 'Plaza' } }
          },
          // No thumbnail: falls back to the full url, and no scene name: falls back to 'Snapshot'.
          { id: 'img-2', thumbnailUrl: '', url: 'https://reels.test/full-2.jpg' }
        ]
      } as unknown as ReturnType<typeof useReelImagesByUser>)
    })

    it('should render the rendered-count and one card per photo', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByText('profile.photos.count')).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })

    it('should use the thumbnail url and scene name for an annotated photo', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      const image = screen.getByAltText('Plaza')
      expect(image.getAttribute('src')).toBe('https://reels.test/thumb-1.jpg')
    })

    it('should fall back to the full url and a Snapshot alt when metadata is missing', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      const image = screen.getByAltText('Snapshot')
      expect(image.getAttribute('src')).toBe('https://reels.test/full-2.jpg')
    })

    it('should open the photo modal when a card is clicked', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      fireEvent.click(screen.getAllByRole('button')[0])
      expect(openPhotoMock).toHaveBeenCalledWith('img-1')
    })
  })
})
