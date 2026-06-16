import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import { PhotosTab } from './PhotosTab'

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
  PhotoCard: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  PhotoImage: () => mockReact.createElement('img')
}))
jest.mock('../../../components/profile/PhotoModal', () => ({ PhotoModal: () => null }))
jest.mock('../../../components/profile/ProfileModal/useOpenPhotoModal', () => ({
  useOpenPhotoModal: () => ({ openImageId: null, open: jest.fn(), close: jest.fn() })
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
})
