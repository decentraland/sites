import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { captureHandledError } from '../modules/captureHandledError'
import { LocaleProvider, type SupportedLocale, useLocale } from './LocaleContext'

// `@dcl/hooks` ships ESM only, which Jest cannot load. The double exposes what
// the provider hands over, which is the contract this file is responsible for:
// the active locale and the translations loaded so far.
jest.mock('@dcl/hooks', () => ({
  TranslationProvider: ({
    locale,
    translations,
    children
  }: {
    locale: string
    translations: Record<string, unknown>
    children: React.ReactNode
  }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'translation-provider',
        'data-locale': locale,
        'data-loaded': Object.keys(translations).sort().join(',')
      },
      children
    )
}))

jest.mock('../modules/captureHandledError', () => ({ captureHandledError: jest.fn() }))

// Stands in for a locale chunk that never arrives (offline, failed deploy).
jest.mock('./zh.json', () => {
  throw new Error('chunk unavailable')
})

const LOCALE_STORAGE_KEY = 'dcl-locale'
const LOCALES: SupportedLocale[] = ['en', 'es', 'fr', 'zh', 'ko', 'ja']

function Consumer() {
  const { locale, setLocale } = useLocale()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      {LOCALES.map(code => (
        <button key={code} onClick={() => setLocale(code)}>
          {code}
        </button>
      ))}
    </div>
  )
}

const renderProvider = async () => {
  render(
    <LocaleProvider>
      <Consumer />
    </LocaleProvider>
  )
  return screen.findByTestId('translation-provider')
}

const pickLocale = (locale: SupportedLocale) => fireEvent.click(screen.getByRole('button', { name: locale }))

const waitForLocale = async (locale: SupportedLocale) => {
  const provider = await screen.findByTestId('translation-provider')
  await waitFor(() => expect(provider).toHaveAttribute('data-locale', locale))
  return provider
}

describe('when the visitor picks another language', () => {
  beforeEach(async () => {
    localStorage.clear()
    await renderProvider()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should hand the loaded translations and the new locale to the translation provider', async () => {
    expect(await waitForLocale('en')).toHaveAttribute('data-loaded', 'en')

    pickLocale('es')

    const provider = await waitForLocale('es')
    expect(provider).toHaveAttribute('data-loaded', 'en,es')
  })

  it('should persist the selection so the next visit starts translated', async () => {
    pickLocale('es')
    await waitForLocale('es')

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es')
  })

  it('should switch back to english when english is picked again', async () => {
    pickLocale('es')
    await waitForLocale('es')

    pickLocale('en')

    await waitForLocale('en')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
  })

  it.each(['es', 'fr', 'ja', 'ko'] as SupportedLocale[])('should load the %s translations on demand', async locale => {
    pickLocale(locale)

    const provider = await waitForLocale(locale)
    expect(provider.getAttribute('data-loaded')?.split(',')).toContain(locale)
  })

  it('should honor the last language picked when two are picked in a row', async () => {
    pickLocale('fr')
    pickLocale('ja')

    await waitForLocale('ja')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ja')
  })
})

describe('when the translations of the selected locale cannot be loaded', () => {
  beforeEach(async () => {
    localStorage.clear()
    await renderProvider()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should keep the visitor on the language that is already rendered', async () => {
    pickLocale('zh')

    await waitForLocale('en')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull()
  })

  it('should report the failure', async () => {
    pickLocale('zh')
    await waitForLocale('en')

    expect(captureHandledError).toHaveBeenCalledWith(expect.any(Error), {
      tags: { feature: 'intl', area: 'locale_chunk', locale: 'zh' }
    })
  })
})

describe('when the browser language has no translations', () => {
  const { language } = navigator

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'language', { value: language, configurable: true })
    jest.resetAllMocks()
  })

  it('should fall back to english', async () => {
    await renderProvider()

    await waitForLocale('en')
  })
})

describe('when the english translations are inlined by the hero prerender', () => {
  beforeEach(() => {
    localStorage.clear()
    window.__dclEn = jest.requireActual('./en.json')
  })

  afterEach(() => {
    delete window.__dclEn
    jest.resetAllMocks()
  })

  it('should apply the locale stored on a previous visit', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'es')

    await renderProvider()

    await waitForLocale('es')
  })

  it('should still switch to another locale on demand', async () => {
    await renderProvider()

    pickLocale('fr')

    await waitForLocale('fr')
  })
})

describe('when useLocale is called outside the provider', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should throw', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<Consumer />)).toThrow('useLocale must be used within LocaleProvider')
  })
})
