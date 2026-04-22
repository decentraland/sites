import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMockLiveNowCard } from '../../../__test-utils__/factories'
import { LiveNowCard } from './LiveNowCard'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
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
    AvatarFallback: create('div', 'avatar-fallback'),
    AvatarImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="avatar-image" {...props} />,
    AvatarRow: create('div', 'avatar-row'),
    AvatarTextContainer: create('div', 'avatar-text'),
    BadgesOverlay: create('div', 'badges-overlay'),
    CardBody: create('div', 'card-body'),
    CardRoot: create('div', 'card-root'),
    JumpInButton: create('div', 'jump-in-button'),
    JumpInButtonContainer: create('div', 'jump-in-container'),
    LiveNowActionArea: create('button', 'action-area'),
    MediaBox: create('div', 'media-box'),
    MediaImage: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fetchpriority?: string }) => (
      <img data-testid="media-image" alt="" {...props} />
    ),
    SceneInfo: create('div', 'scene-info'),
    SceneTitle: ({
      children,
      gutterBottom,
      variant,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode; gutterBottom?: boolean; variant?: string }) => (
      <div data-testid="scene-title" {...props}>
        {children}
      </div>
    )
  }
})

describe('LiveNowCard', () => {
  describe('when rendered as the eager (first) card', () => {
    it('should request the poster with fetchpriority=high and loading=eager for LCP', () => {
      render(<LiveNowCard card={createMockLiveNowCard({ image: 'https://poster.test/a.png' })} eager onClick={jest.fn()} />)

      const img = screen.getByTestId('media-image')
      expect(img).toHaveAttribute('fetchpriority', 'high')
      expect(img.getAttribute('loading')).toBe('eager')
      expect(img).toHaveAttribute('decoding', 'async')
      expect(img.getAttribute('src')).toBe('https://poster.test/a.png')
    })
  })

  describe('when rendered as a non-eager card', () => {
    it('should lazy-load the poster so it does not compete with the LCP image', () => {
      render(<LiveNowCard card={createMockLiveNowCard({ image: 'https://poster.test/b.png' })} onClick={jest.fn()} />)

      const img = screen.getByTestId('media-image')
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img).not.toHaveAttribute('fetchpriority')
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

  describe('when a creatorFaceUrl is provided', () => {
    it('should render the avatar as an <img> pointing at the face URL', () => {
      render(
        <LiveNowCard card={createMockLiveNowCard()} creatorName="Alice" creatorFaceUrl="https://cdn.test/alice.png" onClick={jest.fn()} />
      )

      const img = screen.getByTestId('avatar-image')
      expect(img.getAttribute('src')).toBe('https://cdn.test/alice.png')
      expect(img.getAttribute('alt')).toBe('Alice')
      expect(screen.queryByTestId('avatar-fallback')).not.toBeInTheDocument()
    })
  })

  describe('when no creatorFaceUrl is provided but a creatorName is', () => {
    it('should render the colored fallback circle instead of an empty image or a person silhouette', () => {
      render(<LiveNowCard card={createMockLiveNowCard()} creatorName="Alice" onClick={jest.fn()} />)

      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  describe('when no creatorName is provided', () => {
    it('should not render the avatar row at all', () => {
      render(<LiveNowCard card={createMockLiveNowCard()} onClick={jest.fn()} />)

      expect(screen.queryByTestId('avatar-row')).not.toBeInTheDocument()
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument()
      expect(screen.queryByTestId('avatar-fallback')).not.toBeInTheDocument()
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
