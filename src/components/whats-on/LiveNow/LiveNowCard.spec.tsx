import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Avatar } from '@dcl/schemas'
import { createMockLiveNowCard } from '../../../__test-utils__/factories'
import { LiveNowCard } from './LiveNowCard'

jest.mock('decentraland-ui2', () => ({
  AvatarFace: ({ avatar }: { avatar: Avatar }) => <div data-testid="avatar-face" data-name={avatar.name} />,
  BadgeGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="badge-group">{children}</div>,
  JumpInIcon: () => <span data-testid="jump-in-icon" />,
  LiveBadge: () => <span data-testid="live-badge" />,
  UserCountBadge: ({ count }: { count: number }) => <span data-testid="user-count">{count}</span>,
  Typography: ({ children }: { children: React.ReactNode }) => <p>{children}</p>
}))

// Replace the styled-file factories with plain DOM tags so the test does not
// depend on the emotion/decentraland-ui2 styled pipeline.
jest.mock('./LiveNowCard.styled', () => {
  const create = (tag: string, testid: string) => (props: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
    React.createElement(tag, { 'data-testid': testid, ...props })
  return {
    AvatarLink: create('a', 'avatar-link'),
    AvatarRow: create('div', 'avatar-row'),
    AvatarTextContainer: create('div', 'avatar-text'),
    BadgesOverlay: create('div', 'badges-overlay'),
    CardBody: create('div', 'card-body'),
    CardRoot: create('div', 'card-root'),
    JumpInButton: create('div', 'jump-in-button'),
    JumpInButtonContainer: create('div', 'jump-in-container'),
    LiveNowActionArea: create('button', 'action-area'),
    MediaBox: create('div', 'media-box'),
    MediaImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="media-image" alt="" {...props} />,
    SceneInfo: create('div', 'scene-info'),
    SceneTitle: create('div', 'scene-title')
  }
})

jest.mock('@dcl/schemas', () => ({}))

function buildAvatar(overrides: Partial<Avatar> = {}): Avatar {
  return {
    name: 'Alice',
    ethAddress: '0xAlice',
    avatar: { snapshots: { face256: 'https://example.com/alice.png', body: '' } },
    ...overrides
  } as unknown as Avatar
}

describe('LiveNowCard', () => {
  describe('when rendered as the eager (first) card', () => {
    it('should request the poster with fetchpriority=high and loading=eager for LCP', () => {
      render(<LiveNowCard card={createMockLiveNowCard({ image: 'https://poster.test/a.png' })} eager onClick={jest.fn()} />)

      const img = screen.getByTestId('media-image')
      expect(img.getAttribute('fetchpriority')).toBe('high')
      expect(img.getAttribute('loading')).toBe('eager')
      expect(img.getAttribute('src')).toBe('https://poster.test/a.png')
    })
  })

  describe('when rendered as a non-eager card', () => {
    it('should lazy-load the poster so it does not compete with the LCP image', () => {
      render(<LiveNowCard card={createMockLiveNowCard({ image: 'https://poster.test/b.png' })} onClick={jest.fn()} />)

      const img = screen.getByTestId('media-image')
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img.getAttribute('fetchpriority')).toBe('auto')
    })
  })

  describe('when the card is clicked', () => {
    it('should forward the click with the card payload', () => {
      const onClick = jest.fn()
      const card = createMockLiveNowCard({ title: 'My Event' })
      render(<LiveNowCard card={card} onClick={onClick} />)

      fireEvent.click(screen.getByTestId('action-area'))

      expect(onClick).toHaveBeenCalledWith(card)
    })
  })

  describe('when the avatar has no name', () => {
    it('should render a plain <strong> fallback instead of an empty <a> so axe link-name passes', () => {
      render(
        <LiveNowCard
          card={createMockLiveNowCard()}
          avatar={buildAvatar({ name: '', ethAddress: '0xabcdef1234567890abcdef1234567890abcdef12' })}
          onClick={jest.fn()}
        />
      )

      expect(screen.queryByTestId('avatar-link')).not.toBeInTheDocument()
      expect(screen.getByText(/0xabcd…ef12/)).toBeInTheDocument()
    })
  })

  describe('when the avatar has a name', () => {
    it('should render a profile link pointing to the decentraland.org profile page', () => {
      render(<LiveNowCard card={createMockLiveNowCard()} avatar={buildAvatar()} onClick={jest.fn()} />)

      const link = screen.getByTestId('avatar-link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org/profile/accounts/0xAlice')
      expect(link).toHaveTextContent('Alice')
    })
  })

  describe('when the avatar has a name but no ethAddress (e.g. Genesis Plaza after sanitization)', () => {
    it('should render the name as plain text — never a link with an empty profile href', () => {
      render(
        <LiveNowCard
          card={createMockLiveNowCard()}
          avatar={buildAvatar({ name: 'Decentraland Foundation', ethAddress: '' })}
          onClick={jest.fn()}
        />
      )

      expect(screen.queryByTestId('avatar-link')).not.toBeInTheDocument()
      expect(screen.getByText('Decentraland Foundation')).toBeInTheDocument()
    })
  })

  describe('when the card is an event', () => {
    it('should render the live badge alongside the user count', () => {
      render(<LiveNowCard card={createMockLiveNowCard({ type: 'event', users: 42 })} onClick={jest.fn()} />)

      expect(screen.getByTestId('live-badge')).toBeInTheDocument()
      expect(screen.getByTestId('user-count')).toHaveTextContent('42')
    })
  })

  describe('when the card is a place', () => {
    it('should omit the live badge', () => {
      render(<LiveNowCard card={createMockLiveNowCard({ type: 'place' })} onClick={jest.fn()} />)

      expect(screen.queryByTestId('live-badge')).not.toBeInTheDocument()
    })
  })
})
