import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { captureHandledError } from '../modules/captureHandledError'
import { LocaleProvider } from './LocaleContext'

// The English chunk failing is the one case that cannot share a file with the
// rest of the suite: every other test needs `en.json` to resolve, and the mock
// that makes it throw applies to the whole module registry.
jest.mock('./en.json', () => {
  throw new Error('chunk unavailable')
})

jest.mock('@dcl/hooks', () => ({
  TranslationProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'translation-provider' }, children)
}))

jest.mock('../modules/captureHandledError', () => ({ captureHandledError: jest.fn() }))

describe('when the english translations cannot be loaded', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should report the failure', async () => {
    render(
      <LocaleProvider>
        <span data-testid="child" />
      </LocaleProvider>
    )

    await waitFor(() =>
      expect(captureHandledError).toHaveBeenCalledWith(expect.any(Error), {
        tags: { feature: 'intl', area: 'locale_chunk', locale: 'en' }
      })
    )
  })

  it('should render nothing rather than untranslated copy', async () => {
    render(
      <LocaleProvider>
        <span data-testid="child" />
      </LocaleProvider>
    )

    await waitFor(() => expect(captureHandledError).toHaveBeenCalled())
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })
})
