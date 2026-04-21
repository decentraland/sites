import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useMobileMediaQuery } from 'decentraland-ui2'
import { InvalidPage } from './InvalidPage'

jest.mock('decentraland-ui2', () => {
  const Button = ({ children, ...rest }: { children?: React.ReactNode }) => <button {...rest}>{children}</button>
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  const Box = ({ children, ...rest }: { children?: React.ReactNode }) => <div {...rest}>{children}</div>
  return {
    Box,
    Button,
    Typography,
    useMobileMediaQuery: jest.fn(),
    styled: (tag: unknown) => () => tag
  }
})

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => {
    const values: Record<string, string> = {
      HOME_URL: 'https://decentraland.org',
      EVENTS_URL: 'https://decentraland.org/events/'
    }
    return values[key]
  }
}))

jest.mock('../../components/jump/JumpInButton', () => ({
  JumpInButton: ({ children }: { children?: React.ReactNode }) => <button data-testid="jumpin">{children}</button>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockUseMobileMediaQuery = jest.mocked(useMobileMediaQuery)

describe('InvalidPage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it renders on desktop for an event error', () => {
    beforeEach(() => {
      mockUseMobileMediaQuery.mockReturnValue(false)
    })

    it('should render the JumpIn button and the explore events CTA', () => {
      render(
        <MemoryRouter>
          <InvalidPage kind="event" />
        </MemoryRouter>
      )
      expect(screen.getByTestId('jumpin')).toBeInTheDocument()
      expect(screen.getByText('component.jump.events_page.explore_events_button')).toBeInTheDocument()
    })
  })

  describe('when it renders on mobile for a place error', () => {
    beforeEach(() => {
      mockUseMobileMediaQuery.mockReturnValue(true)
    })

    it('should hide the JumpIn button and show the Go Home CTA in the mobile footer', () => {
      render(
        <MemoryRouter>
          <InvalidPage kind="place" />
        </MemoryRouter>
      )
      expect(screen.queryByTestId('jumpin')).not.toBeInTheDocument()
      expect(screen.getByText('component.jump.invalid_page.go_home_button')).toBeInTheDocument()
    })
  })
})
