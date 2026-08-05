import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DiscoverPlace } from '../../../features/discover'
// Import through the barrel so the re-export contract is exercised too.
import { SceneJumpInModal } from '.'

const mockUseGetProfileQuery = jest.fn()

// The barrel re-exports the RTK Query clients (import.meta env access Jest
// can't parse); the modal only consumes the pure helpers, so alias to them.
jest.mock('../../../features/discover', () => jest.requireActual('../../../features/discover/discover.helpers'))

const mockJumpIn = jest.fn()
jest.mock('../DiscoverJumpInProvider', () => ({
  useDiscoverJumpIn: () => ({ jumpIn: mockJumpIn })
}))

const mockTrack = jest.fn()
jest.mock('../../../hooks/useDeferredTrack', () => ({
  useDeferredTrack: () => mockTrack
}))

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: (...args: unknown[]) => mockUseGetProfileQuery(...args)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

// Run the real SceneJumpInModal.styled.ts through the shared styled shim
// instead of the emotion engine (decentraland-ui2 ships ESM Jest can't
// transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    BadgeGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    LiveBadge: () => <div>LIVE</div>,
    UserCountBadge: ({ count }: { count?: number }) => <div>{count}</div>,

    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray5: '#ecebed', gray3: '#a09ba8', softBlack1: '#161518', white: '#ffffff' }
    }
  }
})

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'empty-1',
    title: 'Quiet Gallery',
    description: 'An art gallery with rotating exhibits',
    image: 'https://example.com/cover.png',
    positions: ['3,4'],
    base_position: '3,4',
    owner: '0xabc',
    user_name: 'GalleristName',
    contact_name: 'ContactName',
    categories: ['art'],
    user_count: 0,
    ...overrides
  }
}

describe('SceneJumpInModal', () => {
  let onClose: jest.Mock
  let originalLocation: Location
  let assignedHrefs: string[]

  beforeEach(() => {
    onClose = jest.fn()
    assignedHrefs = []
    originalLocation = window.location
    // Redefine location so the JUMP IN handler's href assignment is observable
    // and does not trigger jsdom's "navigation not implemented" warning.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'https://decentraland.org',
        get href() {
          return 'https://decentraland.org/discover'
        },
        set href(value: string) {
          assignedHrefs.push(value)
        }
      }
    })
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    jest.resetAllMocks()
  })

  describe('when rendered', () => {
    it('should render a dialog labeled with the place title', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(screen.getByRole('dialog', { name: 'Quiet Gallery' })).toBeInTheDocument()
    })

    it('should render the creator by-line and the coordinates tag', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(screen.getByText(/discover\.card\.by/)).toBeInTheDocument()
      expect(screen.getByText('GalleristName')).toBeInTheDocument()
      expect(screen.getByText('3,4')).toBeInTheDocument()
    })

    it('should render the WHAT TO EXPECT section with the description', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(screen.getByText('discover.scene.what_to_expect')).toBeInTheDocument()
      expect(screen.getByText('An art gallery with rotating exhibits')).toBeInTheDocument()
    })
  })

  describe('when the place has no description', () => {
    it('should omit the WHAT TO EXPECT section', () => {
      render(<SceneJumpInModal place={createPlace({ description: '' })} onClose={onClose} />)

      expect(screen.queryByText('discover.scene.what_to_expect')).not.toBeInTheDocument()
    })
  })

  describe('when the scene has live players (mobile JUMP IN modal)', () => {
    it('should render the LIVE badge and the presence count', () => {
      render(<SceneJumpInModal place={createPlace()} liveCount={24} onClose={onClose} />)

      expect(screen.getByText('LIVE')).toBeInTheDocument()
      expect(screen.getByText('24')).toBeInTheDocument()
    })
  })

  describe('when the scene is empty', () => {
    it('should omit the LIVE badge (default liveCount)', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    })
  })

  describe('when the X button is clicked', () => {
    it('should call onClose', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.close' }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the backdrop is clicked', () => {
    it('should call onClose', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)
      const backdrop = screen.getByRole('dialog').parentElement as HTMLElement

      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when the click lands inside the modal', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.click(screen.getByText('Quiet Gallery'))

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('when a key is pressed', () => {
    it('should call onClose on Escape', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should ignore other keys', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Enter' })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should stop listening for Escape after unmount', () => {
      const { unmount } = render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      unmount()
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('when JUMP IN is clicked', () => {
    it('should hand the place to the shared launcher', () => {
      const place = createPlace()
      render(<SceneJumpInModal place={place} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'jump-in-modal')
    })

    it('should hand world places to the shared launcher too', () => {
      const place = createPlace({ world: true, world_name: 'GalleryWorld' })
      render(<SceneJumpInModal place={place} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'jump-in-modal')
    })
  })

  describe('when the copy-link button is clicked', () => {
    let writeText: jest.Mock

    beforeEach(() => {
      writeText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    })

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    })

    it('should show a transient Copied confirmation after a successful write', async () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))

      expect(await screen.findByRole('status')).toHaveTextContent('discover.scene.copied')
    })

    it('should NOT show the confirmation when the clipboard write is rejected', async () => {
      writeText.mockRejectedValue(new Error('denied'))
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))

      await waitFor(() => expect(writeText).toHaveBeenCalled())
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('should copy the canonical detail URL for the place', () => {
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))

      // origin + buildDetailPath(place) — canonical even when the modal opened
      // in place over /discover without navigating.
      expect(writeText).toHaveBeenCalledWith('https://decentraland.org/discover/place/3,4')
    })

    it('should copy the world detail URL for world places', () => {
      render(<SceneJumpInModal place={createPlace({ world: true, world_name: 'GalleryWorld' })} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))

      expect(writeText).toHaveBeenCalledWith('https://decentraland.org/discover/world/galleryworld')
    })

    it('should fall back to the current page URL when the place has no detail path', () => {
      render(<SceneJumpInModal place={createPlace({ base_position: undefined, positions: [] })} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))

      expect(writeText).toHaveBeenCalledWith('https://decentraland.org/discover')
    })

    it('should swallow clipboard rejections', () => {
      writeText.mockRejectedValue(new Error('denied'))
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(() => fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))).not.toThrow()
      expect(writeText).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the clipboard API is unavailable', () => {
    it('should not throw on copy-link click', () => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
      render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(() => fireEvent.click(screen.getByRole('button', { name: 'discover.scene.copy_link' }))).not.toThrow()
    })
  })

  describe('when rendering the creator identity', () => {
    it('should render the real face256 avatar when the owner profile has one', () => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer.decentraland.org/face256.png' } } }] }
      })
      const { container } = render(<SceneJumpInModal place={createPlace()} onClose={onClose} />)

      expect(container.querySelector('img')).toHaveAttribute('src', 'https://peer.decentraland.org/face256.png')
    })

    it('should skip the profile request and use a synthetic avatar when there is no owner', () => {
      const { container } = render(<SceneJumpInModal place={createPlace({ owner: null })} onClose={onClose} />)

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
      expect(container.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    })

    it('should render no by-line when the place has no creator name', () => {
      render(<SceneJumpInModal place={createPlace({ user_name: undefined, contact_name: undefined, owner: null })} onClose={onClose} />)

      expect(screen.queryByText(/discover\.card\.by/)).not.toBeInTheDocument()
    })
  })

  describe('when delegating JUMP IN', () => {
    it('should call the shared launcher with the jump-in-modal surface', () => {
      const place = createPlace()
      render(<SceneJumpInModal place={place} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.card.jump_in' }))

      expect(mockJumpIn).toHaveBeenCalledWith(place, 'jump-in-modal')
    })
  })
})
