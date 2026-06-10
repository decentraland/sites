import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CreatorWorld } from '../../../features/creators'
import { WorldCreationCard } from './WorldCreationCard'

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('@mui/icons-material/People', () => () => <span data-testid="people-icon" />)

jest.mock('./WorldCreationCard.styled', () => ({
  Card: ({ children, onClick, 'aria-label': ariaLabel }: { children?: React.ReactNode; onClick?: () => void; 'aria-label'?: string }) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  Thumb: ({ children }: { children?: React.ReactNode }) => <div data-testid="thumb">{children}</div>,
  LiveBadge: ({ children }: { children?: React.ReactNode }) => <span data-testid="live-badge">{children}</span>,
  Body: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Name: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  RoleChip: ({ children }: { children?: React.ReactNode }) => <span data-testid="role-chip">{children}</span>
}))

const baseWorld: CreatorWorld = { name: 'my-world.dcl.eth', role: 'owner' }

describe('WorldCreationCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the world name and owner role', () => {
    render(<WorldCreationCard world={baseWorld} onSelect={jest.fn()} />)
    expect(screen.getByText('my-world.dcl.eth')).toBeInTheDocument()
    expect(screen.getByTestId('role-chip')).toHaveTextContent('page.creators.role.owner')
  })

  it('should render the collaborator role label', () => {
    render(<WorldCreationCard world={{ name: 'shared.dcl.eth', role: 'collaborator' }} onSelect={jest.fn()} />)
    expect(screen.getByTestId('role-chip')).toHaveTextContent('page.creators.role.collaborator')
  })

  it('should show the live badge only when there are live users', () => {
    const { rerender } = render(<WorldCreationCard world={baseWorld} onSelect={jest.fn()} />)
    expect(screen.queryByTestId('live-badge')).not.toBeInTheDocument()

    rerender(<WorldCreationCard world={{ ...baseWorld, liveUserCount: 5 }} onSelect={jest.fn()} />)
    expect(screen.getByTestId('live-badge')).toHaveTextContent('5')
  })

  it('should call onSelect with the world name on click', async () => {
    const onSelect = jest.fn()
    render(<WorldCreationCard world={baseWorld} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'my-world.dcl.eth' }))
    expect(onSelect).toHaveBeenCalledWith('my-world.dcl.eth')
  })
})
