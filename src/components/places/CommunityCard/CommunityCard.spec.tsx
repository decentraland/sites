import { fireEvent, render, screen } from '@testing-library/react'
import type { DiscoverCommunity } from '../../../features/discover'
// Import through the barrel so the re-export contract is exercised too.
import { CommunityCard } from '.'

const mockNavigate = jest.fn()
const mockGetThumbnailUrl = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

// `communities.helpers` reads the assets CDN from `config/env`; stub the
// helper so the thumbnail fallback chain is fully deterministic here.
jest.mock('../../../features/communities/communities.helpers', () => ({
  getThumbnailUrl: (...args: unknown[]) => mockGetThumbnailUrl(...args)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null, values?: Record<string, unknown>) =>
    values && 'count' in values ? `${id}:${String(values.count)}` : id ?? ''
}))

// The card renders through decentraland-ui2's EventSmallCard (ESM Jest can't
// transform) — substitute a minimal clickable card that surfaces every prop
// the component wires, so the assertions below could actually fail.
jest.mock('decentraland-ui2', () => ({
  EventSmallCard: (props: {
    image?: string
    title?: string
    creatorName?: string
    creatorAvatarUrl?: string
    timeLabel?: string
    onClick?: () => void
  }) => (
    <button type="button" onClick={props.onClick} aria-label={props.title}>
      <img src={props.image} alt="cover" />
      {props.creatorAvatarUrl && <img src={props.creatorAvatarUrl} alt="creator-avatar" />}
      <span>{props.title}</span>
      {props.creatorName && <span>{props.creatorName}</span>}
      <span>{props.timeLabel}</span>
    </button>
  )
}))

function createCommunity(overrides: Partial<DiscoverCommunity> = {}): DiscoverCommunity {
  return {
    id: 'community-1',
    name: 'Builders Guild',
    description: 'We build things',
    ownerAddress: '0xowner',
    privacy: 'public',
    active: true,
    membersCount: 42,
    ...overrides
  }
}

describe('CommunityCard', () => {
  beforeEach(() => {
    mockGetThumbnailUrl.mockReturnValue('https://cdn.test/social/communities/community-1/raw-thumbnail.png')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered with a community', () => {
    it('should render the community name and the members count label', () => {
      render(<CommunityCard community={createCommunity()} />)

      expect(screen.getByText('Builders Guild')).toBeInTheDocument()
      expect(screen.getByText('discover.communities.members_count:42')).toBeInTheDocument()
    })

    it('should use the CDN thumbnail convention for the cover image', () => {
      render(<CommunityCard community={createCommunity()} />)

      expect(mockGetThumbnailUrl).toHaveBeenCalledWith('community-1')
      expect(screen.getByAltText('cover')).toHaveAttribute('src', 'https://cdn.test/social/communities/community-1/raw-thumbnail.png')
    })
  })

  describe('when the card is clicked', () => {
    it('should navigate to the community detail route', () => {
      render(<CommunityCard community={createCommunity()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Builders Guild' }))

      expect(mockNavigate).toHaveBeenCalledWith('/social/communities/community-1')
    })
  })

  describe('when the CDN thumbnail is unavailable', () => {
    beforeEach(() => {
      mockGetThumbnailUrl.mockReturnValue(undefined)
    })

    it('should fall back to the raw thumbnail from the API payload', () => {
      render(<CommunityCard community={createCommunity({ thumbnails: { raw: 'https://api.test/raw.png' } })} />)

      expect(screen.getByAltText('cover')).toHaveAttribute('src', 'https://api.test/raw.png')
    })

    it('should fall back to the first available thumbnail when there is no raw one', () => {
      render(<CommunityCard community={createCommunity({ thumbnails: { small: 'https://api.test/small.png' } })} />)

      expect(screen.getByAltText('cover')).toHaveAttribute('src', 'https://api.test/small.png')
    })

    it('should fall back to a synthetic avatar when the community has no thumbnails at all', () => {
      render(<CommunityCard community={createCommunity()} />)

      expect(screen.getByAltText('cover').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })
  })

  describe('when the community has a description', () => {
    it('should render it as the creator line with a synthetic avatar', () => {
      render(<CommunityCard community={createCommunity()} />)

      expect(screen.getByText('We build things')).toBeInTheDocument()
      expect(screen.getByAltText('creator-avatar').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })
  })

  describe('when the community has no description', () => {
    it('should omit the creator line and its avatar', () => {
      render(<CommunityCard community={createCommunity({ description: '' })} />)

      expect(screen.queryByAltText('creator-avatar')).not.toBeInTheDocument()
    })
  })
})
