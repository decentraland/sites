import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreCardType } from '../../../features/events/events.discovery.types'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import { WhatsOnCard } from './WhatsOnCard'

jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock(),
  BadgeGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LiveBadge: () => <span>live</span>,
  UserCountBadge: ({ count }: { count: number }) => <span data-testid="users">{count}</span>,
  // Mirrors ui2's EventCard: the JUMP IN control sits INSIDE the clickable card area (a div here, so no
  // button is nested in a button) and only stops the click from reaching the card when a handler is set.
  EventCard: ({
    sceneName,
    loading,
    onClick,
    onJumpInClick,
    onAvatarClick
  }: {
    sceneName: string
    loading?: boolean
    onClick?: () => void
    onJumpInClick?: () => void
    onAvatarClick?: () => void
  }) =>
    loading ? (
      <div data-testid="card-loading" />
    ) : (
      <div
        data-testid="card-action"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') onClick?.()
        }}
      >
        {sceneName}
        <span
          data-testid="jump-in"
          onClick={event => {
            if (!onJumpInClick) return
            event.stopPropagation()
            onJumpInClick()
          }}
        >
          jump in
        </span>
        {onAvatarClick && (
          <span
            data-testid="avatar"
            onClick={event => {
              event.stopPropagation()
              onAvatarClick()
            }}
          />
        )}
      </div>
    )
}))

jest.mock('./WhatsOn.styled', () => {
  const { forwardRef } = jest.requireActual<typeof React>('react')
  return {
    CardWrapper: forwardRef(
      ({ children, $avatarBackgroundColor: _color, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
          {children as React.ReactNode}
        </div>
      )
    )
  }
})

const mockUseGetProfileQuery = jest.fn()
jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: (...args: unknown[]) => mockUseGetProfileQuery(...args)
}))

const mockTrackClick = jest.fn()
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
}))

const mockDeferredTrack = jest.fn()
jest.mock('../../../hooks/useDeferredTrack', () => ({
  useDeferredTrack: () => mockDeferredTrack
}))

jest.mock('../../../utils/assetUrl', () => ({ assetUrl: (path: string) => `https://cdn.example.com${path}` }))

const card: ExploreItem = {
  type: ExploreCardType.PLACE,
  id: 'place-1',
  title: 'Genesis Plaza',
  users: 12,
  image: 'https://example.com/plaza.png',
  coordinates: '3,4',
  creatorAddress: '0xAbC',
  creatorName: 'Jane Doe',
  isGenesisPlaza: false
}

const CurrentLocation = () => <div data-testid="location">{useLocation().pathname}</div>

const onSelect = jest.fn()
const onJumpIn = jest.fn()

const renderCard = (props: React.ComponentProps<typeof WhatsOnCard>) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <WhatsOnCard {...props} />
      <CurrentLocation />
    </MemoryRouter>
  )

describe('when rendering a whats on card', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the card is loading', () => {
    beforeEach(() => {
      renderCard({ loading: true, onSelect, onJumpIn })
    })

    it('should render the placeholder and no actions', () => {
      expect(screen.getByTestId('card-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('jump-in')).toBeNull()
    })
  })

  describe('and the card is clicked', () => {
    beforeEach(async () => {
      renderCard({ card, onSelect, onJumpIn })
      await userEvent.click(screen.getByTestId('card-action'))
    })

    it('should hand the card to the section', () => {
      expect(onSelect).toHaveBeenCalledWith(card)
    })

    it('should still track the click on the wrapper', () => {
      expect(mockTrackClick).toHaveBeenCalledTimes(1)
    })

    it('should not hand the card to the section for a launch', () => {
      expect(onJumpIn).not.toHaveBeenCalled()
    })
  })

  describe('and the card is activated with the keyboard', () => {
    beforeEach(async () => {
      renderCard({ card, onSelect, onJumpIn })
      screen.getByTestId('card-action').focus()
      await userEvent.keyboard('{Enter}')
      await userEvent.keyboard(' ')
    })

    it('should select the card on Enter and on Space', () => {
      expect(onSelect).toHaveBeenCalledTimes(2)
    })
  })

  describe('and the card has no onSelect handler', () => {
    beforeEach(async () => {
      renderCard({ card })
      await userEvent.click(screen.getByTestId('card-action'))
    })

    it('should ignore the click', () => {
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('and Jump In is clicked', () => {
    beforeEach(async () => {
      renderCard({ card, onSelect, onJumpIn })
      await userEvent.click(screen.getByTestId('jump-in'))
    })

    it('should hand the card to the section to launch it', () => {
      expect(onJumpIn).toHaveBeenCalledTimes(1)
      expect(onJumpIn).toHaveBeenCalledWith(card)
    })

    it('should not open the detail', () => {
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('should track the click with the card payload and the jump_in section', () => {
      expect(mockDeferredTrack).toHaveBeenCalledWith('Click', expect.objectContaining({ card: 'Genesis Plaza', section: 'jump_in' }))
    })

    it('should not double count it through the wrapper click tracking', () => {
      expect(mockTrackClick).not.toHaveBeenCalled()
    })
  })

  describe('and the card has no onJumpIn handler', () => {
    beforeEach(async () => {
      renderCard({ card, onSelect })
      await userEvent.click(screen.getByTestId('jump-in'))
    })

    it('should still track the Jump In click without throwing', () => {
      expect(mockDeferredTrack).toHaveBeenCalledWith('Click', expect.objectContaining({ section: 'jump_in' }))
    })
  })

  describe('and the creator avatar is clicked', () => {
    beforeEach(async () => {
      renderCard({ card, onSelect, onJumpIn })
      await userEvent.click(screen.getByTestId('avatar'))
    })

    it('should navigate to the lowercase profile route', () => {
      expect(screen.getByTestId('location')).toHaveTextContent('/profile/0xabc')
    })
  })

  describe('and the card has no creator address', () => {
    beforeEach(() => {
      renderCard({ card: { ...card, creatorAddress: undefined }, onSelect })
    })

    it('should not offer an avatar action', () => {
      expect(screen.queryByTestId('avatar')).toBeNull()
    })
  })

  describe('and the creator profile has loaded', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({ data: { avatars: [{ name: 'Jane', ethAddress: '0xabc', hasClaimedName: true }] } })
      renderCard({ card, onSelect, onJumpIn })
    })

    it('should still render the card', () => {
      expect(screen.getByTestId('card-action')).toHaveTextContent('Genesis Plaza')
    })
  })

  describe('and the card is the genesis plaza', () => {
    beforeEach(() => {
      renderCard({ card: { ...card, isGenesisPlaza: true }, onSelect })
    })

    it('should still render the card', () => {
      expect(screen.getByTestId('card-action')).toBeInTheDocument()
    })
  })
})
