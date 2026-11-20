import React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProfileSurface } from '../../components/profile/ProfileSurface'
import { useGetProfileAddressByNameQuery } from '../../features/profile/profile.names.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { ProfilePage } from './ProfilePage'

jest.mock('../../components/profile/ProfileSurface', () => ({ ProfileSurface: jest.fn(() => null) }))
jest.mock('../../features/profile/profile.names.client', () => ({ useGetProfileAddressByNameQuery: jest.fn() }))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children: React.ReactNode }) => children }))
jest.mock('decentraland-ui2', () => ({
  styled: jest.requireActual('../../__test-utils__/styledMock').styled,
  Box: (props: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', props),
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.createElement('button', props),
  CircularProgress: (props: React.HTMLAttributes<HTMLDivElement>) => React.createElement('div', { ...props, role: 'progressbar' }),
  Typography: ({ variant: _variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) =>
    React.createElement('div', props)
}))

function CurrentLocation() {
  const location = useLocation()
  return <output aria-label="location">{location.pathname + location.search + location.hash}</output>
}

describe('when opening a profile URL', () => {
  let wallet: string
  let path: string
  let lookup: {
    currentData: string | null | undefined
    data?: string
    isFetching: boolean
    isUninitialized: boolean
    isError: boolean
    refetch: jest.Mock
  }

  beforeEach(() => {
    wallet = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'
    path = '/profile/brai'
    lookup = { currentData: undefined, isFetching: false, isUninitialized: false, isError: false, refetch: jest.fn() }
    ;(useGetProfileAddressByNameQuery as jest.Mock).mockReturnValue(lookup)
    ;(useAuthIdentity as jest.Mock).mockReturnValue({ address: wallet })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  function renderProfile() {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <CurrentLocation />
        <Routes>
          <Route path="/profile/:address" element={<ProfilePage />} />
          <Route path="/profile/:address/:tab" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    )
  }

  describe('and the URL contains a wallet', () => {
    beforeEach(() => {
      path = '/profile/0xd9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd/assets?env=dev'
      renderProfile()
    })
    it('should bypass name resolution', () => {
      expect(useGetProfileAddressByNameQuery).toHaveBeenCalledWith(skipToken)
    })
    it('should render the normalized wallet as the own profile with the requested tab', () => {
      expect(ProfileSurface).toHaveBeenCalledWith(expect.objectContaining({ address: wallet, isOwnProfile: true, activeTab: 'assets' }), {})
    })
    it('should preserve the environment override during tab navigation', () => {
      act(() => jest.mocked(ProfileSurface).mock.calls[0][0].onTabChange?.('photos'))
      expect(screen.getByLabelText('location')).toHaveTextContent(`/profile/${wallet}/photos?env=dev`)
    })
    it('should preserve the environment override when exiting a tab', () => {
      act(() => jest.mocked(ProfileSurface).mock.calls[0][0].onExitTab?.())
      expect(screen.getByLabelText('location')).toHaveTextContent(`/profile/${wallet}?env=dev`)
    })
  })

  describe('and the name lookup is pending', () => {
    beforeEach(() => {
      path = '/profile/Brai.DCL.ETH'
      lookup.isFetching = true
      renderProfile()
    })
    it('should look up the normalized registered name', () => {
      expect(useGetProfileAddressByNameQuery).toHaveBeenCalledWith('brai')
    })
    it('should show an accessible loading state', () => {
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('profile.name_lookup.loading')
    })
    it('should withhold the wallet-only profile surface', () => {
      expect(ProfileSurface).not.toHaveBeenCalled()
    })
  })

  describe('and the name is resolved', () => {
    beforeEach(() => {
      path = '/profile/brai/assets?env=dev&ref=test#photos'
      lookup.currentData = wallet
      renderProfile()
    })
    it('should redirect to the wallet while preserving the tab, query and fragment', async () => {
      await waitFor(() => expect(screen.getByLabelText('location')).toHaveTextContent(`/profile/${wallet}/assets?env=dev&ref=test#photos`))
    })
  })

  describe('and another name still has cached data', () => {
    beforeEach(() => {
      lookup.data = wallet
      lookup.isFetching = true
      renderProfile()
    })
    it('should not redirect using the previous name result', () => {
      expect(screen.getByLabelText('location')).toHaveTextContent('/profile/brai')
    })
  })

  describe('and the query has not started', () => {
    beforeEach(() => {
      lookup.isUninitialized = true
      renderProfile()
    })
    it('should show loading instead of a false not-found result', () => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('and the registered name does not exist', () => {
    beforeEach(() => {
      lookup.currentData = null
      renderProfile()
    })
    it('should explain that the name could not be found', () => {
      expect(screen.getByText('profile.name_lookup.not_found')).toBeInTheDocument()
    })
  })

  describe('and the name lookup fails', () => {
    beforeEach(() => {
      lookup.isError = true
      renderProfile()
    })
    it('should show a generic lookup error', () => {
      expect(screen.getByRole('alert')).toHaveTextContent('profile.name_lookup.error')
    })
    it('should retry only after the retry button is pressed', () => {
      fireEvent.click(screen.getByRole('button', { name: 'profile.name_lookup.retry' }))
      expect(lookup.refetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the identifier is malformed', () => {
    beforeEach(() => {
      path = '/profile/invalid-name!'
      renderProfile()
    })
    it('should skip the name lookup', () => {
      expect(useGetProfileAddressByNameQuery).toHaveBeenCalledWith(skipToken)
    })
    it('should retain the invalid-identifier message', () => {
      expect(screen.getByText('profile.not_found.description')).toBeInTheDocument()
    })
  })
})
