import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'
import { ProfileMeRedirect } from './ProfileMeRedirect'

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, Navigate: jest.fn(() => null) }
})

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))

const { useAuthIdentity } = jest.requireMock('../../hooks/useAuthIdentity')
const NavigateMock = Navigate as unknown as jest.Mock

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile" element={<ProfileMeRedirect />} />
        <Route path="/profile/me" element={<ProfileMeRedirect />} />
        <Route path="/profile/me/:tab" element={<ProfileMeRedirect />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProfileMeRedirect', () => {
  beforeEach(() => {
    NavigateMock.mockClear()
    useAuthIdentity.mockReset()
  })

  describe('when the user is unauthenticated', () => {
    beforeEach(() => {
      useAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    })

    it('should redirect to /sign-in with the current path as the redirect param', () => {
      renderAt('/profile/me/overview')
      expect(NavigateMock).toHaveBeenCalledTimes(1)
      const props = NavigateMock.mock.calls[0][0] as { to: string; replace: boolean }
      expect(props.replace).toBe(true)
      expect(props.to).toBe(`/sign-in?redirect=${encodeURIComponent('/profile/me/overview')}`)
    })

    it('should redirect to /sign-in when no tab segment is present', () => {
      renderAt('/profile/me')
      const props = NavigateMock.mock.calls[0][0] as { to: string }
      expect(props.to).toBe(`/sign-in?redirect=${encodeURIComponent('/profile/me')}`)
    })
  })

  describe('when the user is authenticated', () => {
    const address = '0xCafeCafeCafeCafeCafeCafeCafeCafeCafeCafe' as `0x${string}`

    beforeEach(() => {
      useAuthIdentity.mockReturnValue({
        identity: { authChain: [] } as unknown,
        hasValidIdentity: true,
        address
      })
    })

    it('should redirect to /profile/<address> when no tab is present', () => {
      renderAt('/profile/me')
      const props = NavigateMock.mock.calls[0][0] as { to: string; replace: boolean }
      expect(props.replace).toBe(true)
      expect(props.to).toBe(`/profile/${address.toLowerCase()}`)
    })

    it('should preserve the tab segment in the redirect target', () => {
      renderAt('/profile/me/assets')
      const props = NavigateMock.mock.calls[0][0] as { to: string }
      expect(props.to).toBe(`/profile/${address.toLowerCase()}/assets`)
    })

    it('should redirect /profile (no params) to /profile/<address>', () => {
      renderAt('/profile')
      const props = NavigateMock.mock.calls[0][0] as { to: string }
      expect(props.to).toBe(`/profile/${address.toLowerCase()}`)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
})
