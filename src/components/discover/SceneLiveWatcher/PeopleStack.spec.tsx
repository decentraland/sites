import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Profile } from '../../../features/cast2/peer'
import { PeopleStack } from './PeopleStack'

const mockUseRemoteParticipants = jest.fn()
const mockUseProfiles = jest.fn()

jest.mock('@livekit/components-react', () => ({
  useRemoteParticipants: () => mockUseRemoteParticipants()
}))

jest.mock('../../../hooks/useProfiles', () => ({
  useProfiles: (...args: unknown[]) => mockUseProfiles(...args)
}))

jest.mock('../../../features/discover/sceneAdapter', () => ({
  getLivePeerUrl: () => 'https://peer.test'
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null, values?: Record<string, unknown>) =>
    values && 'count' in values ? `${id}:${String(values.count)}` : id ?? ''
}))

// The cast Avatar renders catalyst snapshots + fallback discs — irrelevant
// here; substitute a countable marker.
jest.mock('../../cast/Avatar/Avatar', () => ({
  Avatar: () => <span data-testid="avatar" />
}))

// Run the real PeopleStack.styled.ts through the shared styled shim instead of
// the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    Paper: actual.Box,
    Popover: ({ open, children, onClose }: { open: boolean; children?: React.ReactNode; onClose?: () => void }) =>
      open ? (
        <div role="dialog">
          <button type="button" aria-label="close-popover" onClick={onClose} />
          {children}
        </div>
      ) : null,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray3: '#a09ba8', softBlack1: '#161518', softBlack2: '#242129' },
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

function participant(identity: string): { identity: string } {
  return { identity }
}

describe('PeopleStack', () => {
  let profiles: Map<string, Profile>

  beforeEach(() => {
    profiles = new Map()
    mockUseRemoteParticipants.mockReturnValue([])
    mockUseProfiles.mockImplementation(() => ({ profiles }))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no participants have resolved yet', () => {
    it('should render a disabled pill with the places-api snapshot count', () => {
      render(<PeopleStack initialCount={7} />)

      const trigger = screen.getByRole('button', { name: 'discover.scene.people_count:7' })
      expect(trigger).toBeDisabled()
    })

    it('should fall back to zero when no snapshot count was provided', () => {
      render(<PeopleStack />)

      expect(screen.getByRole('button', { name: 'discover.scene.people_count:0' })).toBeInTheDocument()
    })

    it('should not open a popover when the disabled pill is clicked', () => {
      render(<PeopleStack initialCount={7} />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.people_count:7' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when participants are connected', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([
        participant('0xccc0000000000000000000000000000000000ccc'),
        participant('watcher-guest'),
        participant('0xbbb0000000000000000000000000000000000b0b'),
        participant('0xaaa0000000000000000000000000000000000aaa')
      ])
      profiles.set('0xaaa0000000000000000000000000000000000aaa', { name: 'Alice', hasClaimedName: true } as unknown as Profile)
      profiles.set('0xbbb0000000000000000000000000000000000b0b', { name: 'bob', hasClaimedName: false } as unknown as Profile)
    })

    it('should request profiles only for the 0x wallet identities', () => {
      render(<PeopleStack />)

      expect(mockUseProfiles).toHaveBeenCalledWith(
        [
          '0xccc0000000000000000000000000000000000ccc',
          '0xbbb0000000000000000000000000000000000b0b',
          '0xaaa0000000000000000000000000000000000aaa'
        ],
        'https://peer.test'
      )
    })

    it('should render an enabled pill with the live participant total', () => {
      render(<PeopleStack initialCount={99} />)

      // The live count wins over the stale snapshot.
      expect(screen.getByRole('button', { name: 'discover.scene.people_count:4' })).toBeEnabled()
    })

    it('should list every participant in the popover sorted by profile quality', () => {
      render(<PeopleStack />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.people_count:4' }))

      const dialog = screen.getByRole('dialog')
      const text = dialog.textContent ?? ''
      const aliceAt = text.indexOf('Alice')
      // Unclaimed names render with the DCL `name#last4` convention.
      const bobAt = text.indexOf('bob#0b0b')
      // Wallets with no catalyst profile fall back to the truncated address.
      const anonAt = text.indexOf('0xccc0…0ccc')
      expect(aliceAt).toBeGreaterThanOrEqual(0)
      expect(bobAt).toBeGreaterThan(aliceAt)
      expect(anonAt).toBeGreaterThan(bobAt)
    })

    it('should render the raw identity for non-wallet participants', () => {
      render(<PeopleStack />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.people_count:4' }))

      expect(within(screen.getByRole('dialog')).getByText('watcher-guest')).toBeInTheDocument()
    })

    it('should close the popover when it requests dismissal', () => {
      render(<PeopleStack />)
      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.people_count:4' }))

      fireEvent.click(screen.getByRole('button', { name: 'close-popover' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should append a short address next to named profiles only', () => {
      render(<PeopleStack />)

      fireEvent.click(screen.getByRole('button', { name: 'discover.scene.people_count:4' }))

      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('0xaa…0aaa')).toBeInTheDocument()
      expect(within(dialog).getByText('0xbb…0b0b')).toBeInTheDocument()
    })
  })

  describe('when more participants connect than the stack can show', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([
        participant('0x1111'),
        participant('0x2222'),
        participant('0x3333'),
        participant('0x4444'),
        participant('0x5555'),
        participant('0x6666')
      ])
    })

    it('should cap the collapsed stack at four avatars and fold the rest into a +N disc', () => {
      render(<PeopleStack />)

      const trigger = screen.getByRole('button', { name: 'discover.scene.people_count:6' })
      expect(within(trigger).getAllByTestId('avatar')).toHaveLength(4)
      expect(within(trigger).getByText('+2')).toBeInTheDocument()
    })
  })
})
