import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConfirmEmailPage } from '.'

const getEnvMock = jest.fn()

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => getEnvMock(key)
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../hooks/usePageView', () => ({
  usePageView: () => {}
}))

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, component, variant, ...rest }: { children?: React.ReactNode; component?: string; variant?: string }) =>
    React.createElement(component || 'p', rest, children)
  return {
    styled,
    Box,
    Typography,
    dclColors: {
      brand: { ruby: '#FF2D55' },
      neutral: { white: '#FFFFFF' }
    }
  }
})

const mockTurnstileReset = jest.fn()

jest.mock('@marsidev/react-turnstile', () => ({
  Turnstile: React.forwardRef(
    (
      { onSuccess, onWidgetLoad, onError }: { onSuccess: (t: string) => void; onWidgetLoad: () => void; onError: () => void },
      ref: React.Ref<{ reset: () => void }>
    ) => {
      React.useImperativeHandle(ref, () => ({ reset: mockTurnstileReset }))
      return React.createElement('div', { 'data-testid': 'turnstile' }, [
        React.createElement('button', { key: 'load', 'data-testid': 'turnstile-load', onClick: () => onWidgetLoad() }),
        React.createElement('button', {
          key: 'success',
          'data-testid': 'turnstile-success',
          onClick: () => onSuccess('turnstile-token-123')
        }),
        React.createElement('button', { key: 'error', 'data-testid': 'turnstile-error', onClick: () => onError() })
      ])
    }
  )
}))

const NOTIFICATIONS_URL = 'https://notifications.test'
const MARKETPLACE_URL = 'https://market.test'
const HOMEPAGE_URL = 'https://home.test'
const REAL_SITE_KEY = '0xREALKEY'

const defaultEnv: Record<string, string> = {
  NOTIFICATIONS_API_URL: NOTIFICATIONS_URL,
  CLOUDFLARE_TURNSTILE_SITE_KEY: REAL_SITE_KEY,
  MARKETPLACE_URL,
  DECENTRALAND_HOMEPAGE_URL: HOMEPAGE_URL
}

const originalLocation = window.location

const renderPage = (routePath: string, initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={routePath} element={<ConfirmEmailPage />} />
      </Routes>
    </MemoryRouter>
  )

const solveTurnstile = () => fireEvent.click(screen.getByTestId('turnstile-success'))

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    getEnvMock.mockImplementation((key: string) => defaultEnv[key])
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { href: '' } })
  })

  afterEach(() => {
    jest.resetAllMocks()
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
  })

  describe('when the token is missing', () => {
    it('should render the invalid link message', () => {
      renderPage('/account/confirm-email-challenge', '/account/confirm-email-challenge')
      expect(screen.getByText('page.confirm_email.invalid_link_title')).toBeInTheDocument()
      expect(screen.getByText('page.confirm_email.invalid_link_description')).toBeInTheDocument()
    })
  })

  describe('when the source cannot be resolved', () => {
    it('should render the invalid source message', () => {
      renderPage('/other/:token', '/other/abc?address=0x1')
      expect(screen.getByText('page.confirm_email.invalid_source_title')).toBeInTheDocument()
    })
  })

  describe('when the address is missing', () => {
    it('should render the missing address message', () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?source=account')
      expect(screen.getByText('page.confirm_email.missing_address_title')).toBeInTheDocument()
    })
  })

  describe('when rendering a valid account confirmation link', () => {
    it('should set the document title and show the account challenge copy', () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0x1&source=account')
      expect(document.title).toBe('page.confirm_email.title')
      expect(screen.getByText('page.confirm_email.heading')).toBeInTheDocument()
      expect(screen.getByText('page.confirm_email.description_account')).toBeInTheDocument()
      expect(screen.getByAltText('page.confirm_email.logo_alt')).toBeInTheDocument()
    })

    it('should keep the confirm button disabled until the challenge is solved', () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0x1&source=account')
      const button = screen.getByRole('button', { name: 'page.confirm_email.confirm_button' })
      expect(button).toBeDisabled()
      solveTurnstile()
      expect(button).toBeEnabled()
    })

    it('should PUT the confirmation to the notifications server and show the confirmed state', async () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0xabc&source=account')
      solveTurnstile()
      fireEvent.click(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' }))

      await waitFor(() => expect(screen.getByText('page.confirm_email.heading_confirmed')).toBeInTheDocument())

      expect(global.fetch).toHaveBeenCalledWith(`${NOTIFICATIONS_URL}/confirm-email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: '0xabc', code: 'abc', turnstileToken: 'turnstile-token-123', source: 'account' })
      })
      expect(screen.getByText('page.confirm_email.confirmed_account')).toBeInTheDocument()
    })

    it('should redirect to the account page after a successful account confirmation', async () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0xabc&source=account')
      solveTurnstile()
      fireEvent.click(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' }))

      const redirect = await screen.findByRole('button', { name: 'page.confirm_email.go_to_account' })
      fireEvent.click(redirect)
      expect(window.location.href).toBe(`${HOMEPAGE_URL}/account`)
    })
  })

  describe('when rendering a credits confirmation link', () => {
    it('should show the credits copy and redirect to the marketplace on success', async () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0xabc&source=credits')
      expect(screen.getByText('page.confirm_email.description_credits')).toBeInTheDocument()

      solveTurnstile()
      fireEvent.click(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' }))

      const redirect = await screen.findByRole('button', { name: 'page.confirm_email.go_to_marketplace' })
      expect(screen.getByText('page.confirm_email.confirmed_credits')).toBeInTheDocument()
      fireEvent.click(redirect)
      expect(window.location.href).toBe(MARKETPLACE_URL)
    })
  })

  describe('when the source is derived from a legacy path', () => {
    it('should treat /account/confirm-email as an account confirmation', () => {
      renderPage('/account/confirm-email/:token', '/account/confirm-email/abc?address=0x1')
      expect(screen.getByText('page.confirm_email.description_account')).toBeInTheDocument()
    })

    it('should treat /account/credits-email-confirmed as a credits confirmation', () => {
      renderPage('/account/credits-email-confirmed/:token', '/account/credits-email-confirmed/abc?address=0x1')
      expect(screen.getByText('page.confirm_email.description_credits')).toBeInTheDocument()
    })
  })

  describe('when the confirmation request fails', () => {
    it('should log the raw error and surface a generic message on a non-ok response', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 })

      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0xabc&source=account')
      solveTurnstile()
      fireEvent.click(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' }))

      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('page.confirm_email.error_generic'))
      expect(consoleError).toHaveBeenCalled()
      expect(screen.queryByText('page.confirm_email.heading_confirmed')).not.toBeInTheDocument()
      // The single-use turnstile token must be reset so a retry solves a fresh challenge.
      expect(mockTurnstileReset).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' })).toBeDisabled()
      consoleError.mockRestore()
    })

    it('should surface a generic message when the request throws', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0xabc&source=account')
      solveTurnstile()
      fireEvent.click(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' }))

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
      consoleError.mockRestore()
    })
  })

  describe('when the turnstile widget reports load and error events', () => {
    it('should stay disabled after load alone and re-disable after an error clears the token', () => {
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0x1&source=account')
      const button = screen.getByRole('button', { name: 'page.confirm_email.confirm_button' })

      fireEvent.click(screen.getByTestId('turnstile-load'))
      expect(button).toBeDisabled()

      solveTurnstile()
      expect(button).toBeEnabled()

      fireEvent.click(screen.getByTestId('turnstile-error'))
      expect(button).toBeDisabled()
    })
  })

  describe('when no site key is configured', () => {
    it('should fall back to the test key and enable the button once solved', () => {
      getEnvMock.mockImplementation((key: string) => (key === 'CLOUDFLARE_TURNSTILE_SITE_KEY' ? undefined : defaultEnv[key]))
      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0x1&source=account')

      const button = screen.getByRole('button', { name: 'page.confirm_email.confirm_button' })
      expect(button).toBeDisabled()
      solveTurnstile()
      expect(button).toBeEnabled()
    })
  })

  describe('when the notifications url is not configured', () => {
    it('should fall back to the production notifications origin', async () => {
      getEnvMock.mockImplementation((key: string) => (key === 'NOTIFICATIONS_API_URL' ? undefined : defaultEnv[key]))

      renderPage('/account/confirm-email-challenge/:token', '/account/confirm-email-challenge/abc?address=0xabc&source=account')
      solveTurnstile()
      fireEvent.click(screen.getByRole('button', { name: 'page.confirm_email.confirm_button' }))

      await waitFor(() => expect(global.fetch).toHaveBeenCalled())
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('https://notifications.decentraland.org/confirm-email')
    })
  })
})
