import { fireEvent, render, screen } from '@testing-library/react'
import { UserMetadata } from './UserMetadata'

const trackMock = jest.fn()

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock, isInitialized: true })
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  Chip: ({ label }: { label?: React.ReactNode }) => <span data-testid="reels-guest-chip">{label}</span>,
  Typography: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <p {...(props as object)}>{children}</p>
  ),
  Button: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <button {...(props as object)}>{children}</button>
  ),
  styled: (tag: string) => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const Component = (tag || 'div') as keyof JSX.IntrinsicElements
    return <Component {...(props as object)}>{props.children}</Component>
  }
}))

jest.mock('@mui/icons-material', () => ({
  KeyboardArrowDown: () => <span data-testid="reels-chevron-down" />,
  KeyboardArrowUp: () => <span data-testid="reels-chevron-up" />
}))

jest.mock('./WearableMetadata', () => ({
  WearableMetadata: ({ wearable }: { wearable: { name: string } }) => <div data-testid="reels-wearable">{wearable.name}</div>
}))

jest.mock('../../../features/reels', () => ({
  buildProfileUrl: (address: string) => `https://profile/${address}`
}))

// UserMetadata now calls `useOpenProfileModal()` internally, which depends on
// react-router (`useNavigate` + `useLocation`). The spec has no <Router> in
// scope and doesn't need to assert the modal/navigate plumbing, so mock the
// hook to a noop — keeps tests focused on UserMetadata's own behavior.
const openProfileMock = jest.fn()
jest.mock('../../profile/ProfileModal/useOpenProfileModal', () => ({
  useOpenProfileModal: () => openProfileMock
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const baseUser = {
  userName: 'alice',
  userAddress: '0xa',
  isGuest: false,
  wearables: [],
  wearablesParsed: []
}

describe('UserMetadata', () => {
  beforeEach(() => {
    trackMock.mockReset()
    openProfileMock.mockReset()
  })

  it('should render the user name as a link to the profile', () => {
    render(<UserMetadata user={baseUser} isFirst={true} />)
    const link = screen.getByText('alice').closest('a')
    // Visible href is now the internal SPA route; the legacy URL still rides
    // along in the Segment payload (see UserMetadata.tsx:handleProfileClick).
    expect(link).toHaveAttribute('href', '/profile/0xa')
  })

  it('should render the guest badge when isGuest is true', () => {
    render(<UserMetadata user={{ ...baseUser, isGuest: true }} isFirst={false} />)
    expect(screen.getByTestId('reels-guest-chip')).toHaveTextContent('component.reels.metadata.guest')
  })

  it('should toggle wearables on chevron click and track event', () => {
    render(<UserMetadata user={baseUser} isFirst={true} />)
    expect(screen.getByTestId('reels-chevron-down')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'toggle-wearables' }))
    expect(screen.getByTestId('reels-chevron-up')).toBeInTheDocument()
    expect(trackMock).toHaveBeenCalledWith('Reels Show Wearables', { userAddress: '0xa' })
  })

  it('should track the click, prevent default and open the profile modal on a plain left-click', () => {
    render(<UserMetadata user={baseUser} isFirst={true} />)
    const link = screen.getByText('alice').closest('a') as HTMLAnchorElement

    const prevented = !fireEvent.click(link, { button: 0 })

    expect(trackMock).toHaveBeenCalledWith('Reels Click Profile', {
      userAddress: '0xa',
      legacyProfileUrl: 'https://profile/0xa'
    })
    expect(openProfileMock).toHaveBeenCalledWith('0xa')
    expect(prevented).toBe(true)
  })

  it('should let modifier clicks fall through so the profile can open in a new tab', () => {
    render(<UserMetadata user={baseUser} isFirst={true} />)
    const link = screen.getByText('alice').closest('a') as HTMLAnchorElement

    fireEvent.click(link, { button: 0, metaKey: true })

    // Tracking still fires, but navigation is left to the browser.
    expect(trackMock).toHaveBeenCalledWith('Reels Click Profile', {
      userAddress: '0xa',
      legacyProfileUrl: 'https://profile/0xa'
    })
    expect(openProfileMock).not.toHaveBeenCalled()
  })

  it('should render a static name without a link when the user has no address', () => {
    render(<UserMetadata user={{ ...baseUser, userAddress: '' }} isFirst={true} />)
    expect(screen.getByText('alice').closest('a')).toBeNull()
  })

  it('should render NoWearables placeholder when wearablesParsed is empty', () => {
    render(<UserMetadata user={baseUser} isFirst={true} initialWearableVisibility={true} />)
    expect(screen.getByText('component.reels.metadata.no_wearable')).toBeInTheDocument()
  })

  it('should render wearables when provided and visible', () => {
    const userWithWearables = {
      ...baseUser,
      wearablesParsed: [
        { id: 'w1', name: 'Hat', urn: 'u', image: '', rarity: 'rare' as const },
        { id: 'w2', name: 'Shirt', urn: 'u2', image: '', rarity: 'common' as const }
      ]
    }
    render(<UserMetadata user={userWithWearables} isFirst={true} initialWearableVisibility={true} />)
    expect(screen.getAllByTestId('reels-wearable')).toHaveLength(2)
  })
})
