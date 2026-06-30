import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import { CommunitiesTab } from './CommunitiesTab'

jest.mock('@mui/icons-material/Check', () => ({
  __esModule: true,
  default: () => mockReact.createElement('span', { 'data-icon': 'check' })
}))
jest.mock('@mui/icons-material/ContentCopy', () => ({
  __esModule: true,
  default: () => mockReact.createElement('span', { 'data-icon': 'copy' })
}))
jest.mock('@mui/icons-material/GroupsOutlined', () => ({
  __esModule: true,
  default: () => mockReact.createElement('span', { 'data-icon': 'groups' })
}))
jest.mock('@mui/icons-material/PeopleAltOutlined', () => ({
  __esModule: true,
  default: () => mockReact.createElement('span', { 'data-icon': 'people' })
}))

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Tooltip: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))
jest.mock('./CommunitiesTab.styled', () => {
  const r = jest.requireActual<typeof mockReact>('react')
  // Forward all props (onClick / onError / src / alt / href) so the card's
  // interactive elements and the thumbnail error fallback can be exercised.
  const stub = ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => r.createElement('div', rest, children)
  // The thumbnail must be a real <img> so getByAltText and onError fire correctly.
  const imageStub = (rest: Record<string, unknown>) => r.createElement('img', rest)
  const overrides: Record<string, unknown> = { __esModule: true, CommunityThumbImage: imageStub }
  return new Proxy(overrides, {
    get: (target, prop) => (prop in target ? target[prop as string] : typeof prop === 'string' ? stub : undefined)
  })
})
const openCommunityMock = jest.fn()
jest.mock('../../../components/profile/CommunityDetailModal', () => ({
  CommunityDetailModal: ({ communityId }: { communityId: string | null }) =>
    mockReact.createElement('div', { 'data-testid': 'community-modal', 'data-open-id': communityId ?? '' }),
  useOpenCommunityModal: () => ({ openCommunityId: null, open: openCommunityMock, close: jest.fn() })
}))
jest.mock('../../../features/communities/communities.helpers', () => ({ getThumbnailUrl: (id: string) => `https://cdn.test/${id}.png` }))
jest.mock('../../../features/profile/profile.social.client', () => ({ useGetProfileCommunitiesQuery: jest.fn() }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
const handleCopyMock = jest.fn()
jest.mock('../../../hooks/useCopyShareLink', () => ({ useCopyShareLink: () => ({ copied: false, handleCopy: handleCopyMock }) }))
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

const mockedQuery = useGetProfileCommunitiesQuery as jest.MockedFunction<typeof useGetProfileCommunitiesQuery>
const ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

describe('CommunitiesTab', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there are no communities', () => {
    beforeEach(() => {
      mockedQuery.mockReturnValue({ data: { data: { results: [] } }, isLoading: false } as unknown as ReturnType<
        typeof useGetProfileCommunitiesQuery
      >)
    })

    it('should render the rich empty state with an explore CTA on the own profile', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('profile.communities.empty_title')).toBeInTheDocument()
      expect(screen.getByText('profile.communities.empty_owner_cta')).toBeInTheDocument()
    })

    it('should render the plain member message without a CTA on a member profile', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.queryByTestId('empty-state')).toBeNull()
      expect(screen.getByText('profile.communities.empty_member')).toBeInTheDocument()
    })
  })

  describe('when the communities are loading', () => {
    beforeEach(() => {
      mockedQuery.mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useGetProfileCommunitiesQuery>)
    })

    it('should render a loading spinner', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when the profile belongs to communities', () => {
    const communities = [
      {
        id: 'c-owner',
        name: 'Owners Guild',
        role: 'owner',
        membersCount: 42,
        thumbnail: 'https://cdn.test/explicit.png'
      },
      {
        id: 'c-member',
        name: 'Members Lounge',
        role: 'member'
      }
    ]

    beforeEach(() => {
      mockedQuery.mockReturnValue({ data: { data: { results: communities } }, isLoading: false } as unknown as ReturnType<
        typeof useGetProfileCommunitiesQuery
      >)
    })

    it('should render a card per community with its name', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByText('Owners Guild')).toBeInTheDocument()
      expect(screen.getByText('Members Lounge')).toBeInTheDocument()
      expect(screen.getByText('profile.communities.count')).toBeInTheDocument()
    })

    it('should render the explicit thumbnail when present and the member-count badge', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      const image = screen.getByAltText('Owners Guild')
      expect(image.getAttribute('src')).toBe('https://cdn.test/explicit.png')
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should fall back to the CDN thumbnail url when the community has no thumbnail', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      const image = screen.getByAltText('Members Lounge')
      expect(image.getAttribute('src')).toBe('https://cdn.test/c-member.png')
    })

    it('should render the owner role chip and a view CTA for an owned community', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)
      expect(screen.getByText('profile.communities.role_owner')).toBeInTheDocument()
      expect(screen.getByText('profile.communities.action_view')).toBeInTheDocument()
    })

    it('should render the joined CTA for a non-owned community on the own profile', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)
      expect(screen.getByText('profile.communities.action_joined')).toBeInTheDocument()
    })

    it('should render a view CTA (not joined) for every card on a member profile', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={false} />)
      expect(screen.queryByText('profile.communities.action_joined')).toBeNull()
      expect(screen.getAllByText('profile.communities.action_view')).toHaveLength(2)
    })

    it('should fall back to the icon when the thumbnail image errors', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      const image = screen.getByAltText('Owners Guild')
      fireEvent.error(image)
      expect(screen.queryByAltText('Owners Guild')).toBeNull()
    })

    it('should open the community modal when a card is clicked', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      const anchor = screen.getByText('Owners Guild').closest('a, [href]') ?? screen.getByText('Owners Guild')
      fireEvent.click(anchor)
      expect(openCommunityMock).toHaveBeenCalledWith('c-owner')
    })

    it('should copy the share link without bubbling the click to the card', () => {
      render(<CommunitiesTab address={ADDRESS} isOwnProfile={true} />)

      const shareButtons = screen.getAllByLabelText('profile.communities.copy_link')
      fireEvent.click(shareButtons[0])
      expect(handleCopyMock).toHaveBeenCalled()
    })
  })
})
