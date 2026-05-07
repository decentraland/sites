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

jest.mock('../../../features/media/reels', () => ({
  buildProfileUrl: (address: string) => `https://profile/${address}`
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
  beforeEach(() => trackMock.mockReset())

  it('should render the user name as a link to the profile', () => {
    render(<UserMetadata user={baseUser} isFirst={true} />)
    const link = screen.getByText('alice').closest('a')
    expect(link).toHaveAttribute('href', 'https://profile/0xa')
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
