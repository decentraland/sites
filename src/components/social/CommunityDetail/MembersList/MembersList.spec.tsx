import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { Role } from '../../../../features/communities/communities.types'
import { MembersList } from './MembersList'
import type { MemberCardProps } from './MemberCard.types'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../../hooks/useInfiniteScrollSentinel', () => ({
  useInfiniteScrollSentinel: () => ({ current: null })
}))

jest.mock('../../../../config/env', () => ({
  getEnv: () => 'https://cdn.test'
}))

// Stub decentraland-ui2 imports (ESM bundle Jest can't transform).
jest.mock('decentraland-ui2', () => {
  const make = (testid: string) =>
    mockReact.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { backgroundColor?: string }>(
      ({ backgroundColor: _backgroundColor, ...props }, ref) => mockReact.createElement('div', { 'data-testid': testid, ref, ...props })
    )
  return {
    Box: make('box'),
    Typography: make('typography'),
    Avatar: make('avatar'),
    CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
    useTheme: () => ({ palette: { secondary: { main: '#000' } }, spacing: () => 0 })
  }
})

jest.mock('./MembersList.styled', () => {
  const make = (testid: string) =>
    mockReact.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { backgroundColor?: string }>(
      ({ backgroundColor: _backgroundColor, ...props }, ref) => mockReact.createElement('div', { 'data-testid': testid, ref, ...props })
    )
  return {
    EmptyState: make('empty-state'),
    InitialLoader: make('initial-loader'),
    LoadMoreSentinel: make('load-more-sentinel'),
    MemberAvatar: make('member-avatar'),
    MemberAvatarContainer: make('member-avatar-container'),
    MemberInfo: make('member-info'),
    MemberItem: make('member-item'),
    MemberListContainer: make('member-list-container'),
    MemberName: make('member-name'),
    MemberNameRow: make('member-name-row'),
    MemberRole: make('member-role'),
    MembersSection: make('members-section'),
    SectionTitle: make('section-title'),
    SentinelLoader: make('sentinel-loader')
  }
})

function renderMembersList(props: Partial<React.ComponentProps<typeof MembersList>> = {}) {
  const defaults = {
    members: [] as MemberCardProps[],
    isLoading: false,
    isFetchingMore: false,
    hasMore: false,
    onLoadMore: jest.fn()
  }
  return render(<MembersList {...defaults} {...props} />)
}

describe('MembersList', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when loading initial members', () => {
    it('should render the section title key', () => {
      renderMembersList({ isLoading: true })
      expect(screen.getByText(/community\.members_list\.title/)).toBeInTheDocument()
    })

    it('should hide the title when hideTitle is true', () => {
      renderMembersList({ isLoading: true, hideTitle: true })
      expect(screen.queryByText(/community\.members_list\.title/)).not.toBeInTheDocument()
    })

    it('should render a progress indicator', () => {
      renderMembersList({ isLoading: true })
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when there are no members', () => {
    it('should render the empty state', () => {
      renderMembersList({ members: [] })
      expect(screen.getByText('community.members_list.no_members_found')).toBeInTheDocument()
    })
  })

  describe('when there are members', () => {
    let members: MemberCardProps[]

    beforeEach(() => {
      members = [
        { memberAddress: '0x111', name: 'John Doe', role: 'admin', profilePictureUrl: '', hasClaimedName: false },
        { memberAddress: '0x222', name: 'Jane Smith', role: Role.MEMBER, profilePictureUrl: '', hasClaimedName: true }
      ]
    })

    it('should render every member name', () => {
      renderMembersList({ members })
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should display every role label', () => {
      renderMembersList({ members })
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('member')).toBeInTheDocument()
    })

    it('should show the claimed-name icon for members that claimed a name', () => {
      renderMembersList({ members })
      expect(screen.getByTestId('claimed-name-icon')).toBeInTheDocument()
    })

    it('should append the total count to the title when showCount is on', () => {
      renderMembersList({ members, total: 15 })
      expect(screen.getByText('community.members_list.title (15)')).toBeInTheDocument()
    })

    it('should hide the count when showCount is false', () => {
      renderMembersList({ members, total: 15, showCount: false })
      expect(screen.getByText('community.members_list.title')).toBeInTheDocument()
    })
  })

  describe('when fetching more members', () => {
    it('should render a sentinel progress indicator', () => {
      renderMembersList({
        members: [{ memberAddress: '0x1', name: 'A', role: 'admin', profilePictureUrl: '' }],
        hasMore: true,
        isFetchingMore: true
      })
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})
