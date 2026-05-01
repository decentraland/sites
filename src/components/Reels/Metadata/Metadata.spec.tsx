import { fireEvent, render, screen } from '@testing-library/react'
import { Metadata } from './Metadata'

const trackMock = jest.fn()
const buildPlaceUrlMock = jest.fn()

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock, isInitialized: true })
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  Button: ({
    children,
    href,
    onClick,
    ...props
  }: { children?: React.ReactNode; href?: string; onClick?: () => void } & Record<string, unknown>) => (
    <a href={href} onClick={onClick} {...(props as object)}>
      {children}
    </a>
  ),
  Typography: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <p {...(props as object)}>{children}</p>
  ),
  styled: (tag: string) => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const Component = (tag || 'div') as keyof JSX.IntrinsicElements
    return <Component {...(props as object)}>{props.children}</Component>
  }
}))

jest.mock('@mui/icons-material', () => ({
  LocationOnOutlined: () => <span data-testid="reels-location-icon" />
}))

jest.mock('../Logo', () => ({ Logo: () => <div data-testid="reels-logo" /> }))
jest.mock('../LoadingText', () => ({ LoadingText: () => <div data-testid="reels-loading-text" /> }))
jest.mock('./UserMetadata', () => ({
  UserMetadata: ({ user }: { user: { userName: string } }) => <div data-testid="reels-user">{user.userName}</div>
}))

jest.mock('../../../features/reels', () => ({
  buildAvatarUrl: (address: string) => `https://avatar/${address}`,
  buildJumpInUrl: () => 'https://jump',
  buildPlaceUrl: (...args: [string, string, AbortSignal?]) => buildPlaceUrlMock(...args),
  buildProfileUrl: (address: string) => `https://profile/${address}`,
  formatPhotoDate: () => 'May 01 2026'
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const fakeMetadata = {
  userName: 'alice',
  userAddress: '0xa',
  dateTime: '2026-05-01T12:00:00Z',
  realm: '',
  scene: { name: 'Plaza', location: { x: '0', y: '0' } },
  visiblePeople: [
    { userName: 'alice', userAddress: '0xa', isGuest: false, wearables: [], wearablesParsed: [] },
    { userName: 'bob', userAddress: '0xb', isGuest: true, wearables: [], wearablesParsed: [] }
  ]
}

describe('Metadata', () => {
  beforeEach(() => {
    trackMock.mockReset()
    buildPlaceUrlMock.mockReset()
    buildPlaceUrlMock.mockResolvedValue(null)
  })

  describe('when loading', () => {
    it('should render skeleton placeholders', () => {
      render(<Metadata metadata={fakeMetadata} loading={true} visible={true} />)
      expect(screen.getAllByTestId('reels-loading-text').length).toBeGreaterThan(0)
    })
  })

  describe('when loaded', () => {
    it('should render the photo date and user name', () => {
      render(<Metadata metadata={fakeMetadata} loading={false} visible={true} />)
      expect(screen.getByText('May 01 2026')).toBeInTheDocument()
      const profileLink = screen.getByRole('link', { name: 'alice' })
      expect(profileLink).toHaveAttribute('href', 'https://profile/0xa')
    })

    it('should render the scene name and coordinates', () => {
      render(<Metadata metadata={fakeMetadata} loading={false} visible={true} />)
      expect(screen.getByText('Plaza 0,0')).toBeInTheDocument()
    })

    it('should track REELS_JUMP_IN when the jump-in button is clicked', () => {
      render(<Metadata metadata={fakeMetadata} loading={false} visible={true} />)
      fireEvent.click(screen.getByText('component.reels.metadata.jump_in'))
      expect(trackMock).toHaveBeenCalledWith('Reels Jump In', { x: '0', y: '0' })
    })

    it('should render UserMetadata for each visible person', () => {
      render(<Metadata metadata={fakeMetadata} loading={false} visible={true} />)
      expect(screen.getAllByTestId('reels-user')).toHaveLength(2)
    })
  })
})
