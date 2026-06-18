import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import { CommunitiesTab } from './CommunitiesTab'

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Tooltip: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))
jest.mock('./CommunitiesTab.styled', () => {
  const r = jest.requireActual<typeof mockReact>('react')
  const stub = ({ children }: { children?: React.ReactNode }) => r.createElement('p', null, children)
  return new Proxy({ __esModule: true } as Record<string, unknown>, {
    get: (target, prop) => (prop in target ? target[prop as string] : typeof prop === 'string' ? stub : undefined)
  })
})
jest.mock('../../../components/profile/CommunityDetailModal', () => ({
  CommunityDetailModal: () => null,
  useOpenCommunityModal: () => ({ openCommunityId: null, open: jest.fn(), close: jest.fn() })
}))
jest.mock('../../../features/communities/communities.helpers', () => ({ getThumbnailUrl: () => '' }))
jest.mock('../../../features/profile/profile.social.client', () => ({ useGetProfileCommunitiesQuery: jest.fn() }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
jest.mock('../../../hooks/useCopyShareLink', () => ({ useCopyShareLink: () => ({ copied: false, handleCopy: jest.fn() }) }))
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
})
