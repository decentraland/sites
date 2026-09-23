import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import { PhotosTab } from './PhotosTab'

jest.mock('@mui/icons-material/ImageOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/LockOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/PhotoLibraryOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/PublicOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Typography: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children)
}))
jest.mock('../../../components/profile/FilterChips', () => ({
  FiltersRow: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', { 'data-testid': 'filters' }, children),
  FilterChip: ({ label, onClick, ['aria-pressed']: pressed }: { label: string; onClick?: () => void; 'aria-pressed'?: boolean }) =>
    mockReact.createElement('button', { onClick, 'data-testid': 'filter-chip', 'aria-pressed': String(pressed) }, label)
}))
jest.mock('./OverviewTab.styled', () => ({
  EmptyBio: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children),
  LoadingRow: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))
jest.mock('./PhotosTab.styled', () => ({
  PhotosGrid: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  PhotoCard: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
    mockReact.createElement('button', { onClick, 'data-testid': 'photo-card' }, children),
  PhotoImage: ({ src, alt }: { src?: string; alt?: string }) => mockReact.createElement('img', { src, alt }),
  PrivateBadge: ({ children }: { children?: React.ReactNode }) =>
    mockReact.createElement('span', { 'data-testid': 'private-badge' }, children)
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
jest.mock('../../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => ({ identity: { authChain: [] } }) }))
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
const PUBLIC_IMAGE = {
  id: 'pub-1',
  thumbnailUrl: 'https://reels.test/thumb-1.jpg',
  url: 'https://reels.test/full-1.jpg',
  isPublic: true,
  metadata: { scene: { name: 'Plaza' } }
}
// No thumbnail (falls back to full url) and no scene name (falls back to 'Snapshot').
const PRIVATE_IMAGE = { id: 'priv-1', thumbnailUrl: '', url: 'https://reels.test/full-2.jpg', isPublic: false }

const mockImages = (images: unknown[], isLoading = false) =>
  mockedReels.mockReturnValue({ images, isLoading } as unknown as ReturnType<typeof useReelImagesByUser>)

describe('PhotosTab', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when fetching the gallery', () => {
    beforeEach(() => {
      mockImages([])
    })

    it('should sign the request with the identity on the own profile so private snapshots are included', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      expect(mockedReels).toHaveBeenCalledWith(ADDRESS, { limit: 24, offset: 0 }, expect.anything())
    })

    it('should fetch unsigned (no identity) on a member profile so only public photos come back', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      expect(mockedReels).toHaveBeenCalledWith(ADDRESS, { limit: 24, offset: 0 }, undefined)
    })
  })

  describe('when there are no photos', () => {
    beforeEach(() => {
      mockImages([])
    })

    it('should render the rich empty state with a jump-in CTA on the own profile', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('profile.photos.empty_title')).toBeInTheDocument()
      expect(screen.getByText('profile.photos.empty_owner_cta')).toBeInTheDocument()
      // No photos at all → no filter chips, just the jump-in prompt.
      expect(screen.queryByTestId('filter-chip')).toBeNull()
    })

    it('should render the plain member message without a CTA on a member profile', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.queryByTestId('empty-state')).toBeNull()
      expect(screen.getByText('profile.photos.empty_member')).toBeInTheDocument()
    })
  })

  describe('when photos are loading', () => {
    beforeEach(() => {
      mockImages([], true)
    })

    it('should render a loading spinner', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when the member profile has photos', () => {
    beforeEach(() => {
      mockImages([
        PUBLIC_IMAGE,
        { ...PUBLIC_IMAGE, id: 'pub-2', thumbnailUrl: '', url: 'https://reels.test/full-2.jpg', metadata: undefined }
      ])
    })

    it('should not render the visibility filter for a visitor', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.queryByTestId('filter-chip')).toBeNull()
    })

    it('should render the rendered-count and one card per photo', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.photos.count')).toBeInTheDocument()
      expect(screen.getAllByTestId('photo-card')).toHaveLength(2)
    })

    it('should use the thumbnail url and scene name for an annotated photo', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      const image = screen.getByAltText('Plaza')
      expect(image.getAttribute('src')).toBe('https://reels.test/thumb-1.jpg')
    })

    it('should fall back to the full url and a Snapshot alt when metadata is missing', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      const image = screen.getByAltText('Snapshot')
      expect(image.getAttribute('src')).toBe('https://reels.test/full-2.jpg')
    })

    it('should open the photo modal when a card is clicked', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={false} />)

      fireEvent.click(screen.getAllByTestId('photo-card')[0])
      expect(openPhotoMock).toHaveBeenCalledWith('pub-1')
    })
  })

  describe('when the owner filters by visibility', () => {
    beforeEach(() => {
      mockImages([PUBLIC_IMAGE, PRIVATE_IMAGE])
    })

    it('should render the three visibility filter chips', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getAllByTestId('filter-chip')).toHaveLength(3)
      expect(screen.getByText('profile.photos.filter_all')).toBeInTheDocument()
      expect(screen.getByText('profile.photos.filter_public')).toBeInTheDocument()
      expect(screen.getByText('profile.photos.filter_private')).toBeInTheDocument()
    })

    it('should default to showing only public photos', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getAllByTestId('photo-card')).toHaveLength(1)
      expect(screen.getByAltText('Plaza')).toBeInTheDocument()
      expect(screen.queryByTestId('private-badge')).toBeNull()
    })

    it('should show only private photos when the Private filter is selected', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      fireEvent.click(screen.getByText('profile.photos.filter_private'))

      expect(screen.getAllByTestId('photo-card')).toHaveLength(1)
      expect(screen.getByAltText('Snapshot')).toBeInTheDocument()
      expect(screen.getByTestId('private-badge')).toBeInTheDocument()
    })

    it('should show every photo with a badge on the private ones when All is selected', () => {
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      fireEvent.click(screen.getByText('profile.photos.filter_all'))

      expect(screen.getAllByTestId('photo-card')).toHaveLength(2)
      expect(screen.getAllByTestId('private-badge')).toHaveLength(1)
    })

    it('should keep the chips and show an empty-filter message when no photo matches the filter', () => {
      mockImages([PRIVATE_IMAGE])
      render(<PhotosTab address={ADDRESS} isOwnProfile={true} />)

      // Default filter is Public, but the only photo is private → empty for this filter.
      expect(screen.queryByTestId('photo-card')).toBeNull()
      expect(screen.getByText('profile.photos.empty_filter')).toBeInTheDocument()
      expect(screen.getAllByTestId('filter-chip')).toHaveLength(3)
    })
  })
})
