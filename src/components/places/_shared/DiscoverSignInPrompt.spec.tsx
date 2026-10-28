import { fireEvent, render, screen } from '@testing-library/react'
import { redirectToAuth } from '../../../utils/authRedirect'
import { DiscoverSignInPrompt } from './DiscoverSignInPrompt'

jest.mock('../../../utils/authRedirect', () => ({
  redirectToAuth: jest.fn()
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    )
  }
})

const mockRedirectToAuth = redirectToAuth as jest.Mock

describe('DiscoverSignInPrompt', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should explain why the tab is empty', () => {
    render(<DiscoverSignInPrompt message="discover.explore.signin_my_places" returnTab="my" />)

    expect(screen.getByText('discover.explore.signin_my_places')).toBeInTheDocument()
  })

  it('should send the visitor to sign in and bring them back to the same tab', () => {
    render(<DiscoverSignInPrompt message="discover.explore.signin_my_places" returnTab="my" />)

    fireEvent.click(screen.getByRole('button', { name: 'discover.explore.sign_in' }))

    expect(mockRedirectToAuth).toHaveBeenCalledWith('/places', { tab: 'my' })
  })
})
