import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TranslationProvider } from '@dcl/hooks'
import type { LanguageTranslations } from '@dcl/hooks/esm/hooks/useTranslation/useTranslation.type'
import { captureHandledError } from '../modules/captureHandledError'

type SupportedLocale = 'en' | 'es' | 'fr' | 'zh' | 'ko' | 'ja'
type Translations = LanguageTranslations[keyof LanguageTranslations]

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __dclEn?: Translations
  }
}

const LOCALE_STORAGE_KEY = 'dcl-locale'

const SUPPORTED_LOCALES: ReadonlyArray<SupportedLocale> = ['en', 'es', 'fr', 'zh', 'ko', 'ja']

// `prerender-hero.mjs` inlines `src/intl/en.json` into the HTML response as
// `window.__dclEn`. JSON.parse decodes that payload ~5× faster than the JS
// parser would handle the equivalent ESM module, and removing the static
// import drops ~56 KB raw / ~17 KB gzip from the main bundle. We dynamic-
// import as a fallback for `vite dev` and any host where the prerender step
// didn't run (CI smoke tests, partial deploys, etc).
const readInlineEnglish = (): Translations | undefined => (typeof window !== 'undefined' ? window.__dclEn : undefined)
const loadEnglish = (): Promise<Translations> => import('./en.json').then(m => m.default as unknown as Translations)

// Each non-English locale ships ~30–55 KB of JSON. Eagerly importing all six
// adds ~70 KB gzip to the main bundle even though the visitor only ever uses
// one. Each language is loaded on demand once we know what the visitor wants.
const localeLoaders: Record<Exclude<SupportedLocale, 'en'>, () => Promise<{ default: Translations }>> = {
  es: () => import('./es.json') as Promise<{ default: Translations }>,
  fr: () => import('./fr.json') as Promise<{ default: Translations }>,
  ja: () => import('./ja.json') as Promise<{ default: Translations }>,
  ko: () => import('./ko.json') as Promise<{ default: Translations }>,
  zh: () => import('./zh.json') as Promise<{ default: Translations }>
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(value)
}

function getInitialLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && isSupportedLocale(stored)) return stored
  } catch {
    // localStorage unavailable
  }

  try {
    const browserLang = navigator.language?.split('-')[0]
    if (browserLang && isSupportedLocale(browserLang)) return browserLang
  } catch {
    // navigator unavailable (e.g. SSR)
  }

  return 'en'
}

function storeLocale(locale: SupportedLocale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // localStorage unavailable
  }
}

interface LocaleContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

// `useTranslation().setLocale` only accepts a language whose messages already
// sit in `translations`, and ours arrive in a lazy chunk. This context hands
// consumers a setter that loads the chunk first and switches afterwards.
// eslint-disable-next-line @typescript-eslint/naming-convention
const LocaleContext = createContext<LocaleContextValue | null>(null)

function LocaleProvider({ children }: { children: ReactNode }) {
  // First paint always uses `en` so the LCP card and navbar copy don't block on
  // a JSON roundtrip. Visitors with a non-English preference see English for a
  // few hundred ms before their locale chunk takes over.
  const [locale, setActiveLocale] = useState<SupportedLocale>('en')
  const [translations, setTranslations] = useState<LanguageTranslations>(() => {
    const inlineEn = readInlineEnglish()
    const initial: LanguageTranslations = {}
    if (inlineEn) initial.en = inlineEn
    return initial
  })
  // A visitor clicking through the language menu can leave slower chunks in
  // flight; only the last requested locale may switch the page.
  const requestedLocale = useRef<SupportedLocale>('en')
  const hasEnglish = translations.en !== undefined

  const applyLocale = useCallback((next: SupportedLocale, persist: boolean) => {
    requestedLocale.current = next

    const commit = () => {
      if (requestedLocale.current !== next) return
      setActiveLocale(next)
      if (persist) storeLocale(next)
    }

    if (next === 'en') {
      commit()
      return
    }

    localeLoaders[next]()
      .then(mod => {
        setTranslations(prev => (prev[next] ? prev : { ...prev, [next]: mod.default }))
        commit()
      })
      .catch(loadError => {
        // The visitor stays on the language already on screen.
        captureHandledError(loadError, { tags: { feature: 'intl', area: 'locale_chunk', locale: next } })
      })
  }, [])

  useEffect(() => {
    if (hasEnglish) return
    let cancelled = false
    loadEnglish()
      .then(english => {
        if (cancelled) return
        setTranslations(prev => ({ ...prev, en: english }))
      })
      .catch(loadError => captureHandledError(loadError, { tags: { feature: 'intl', area: 'locale_chunk', locale: 'en' } }))
    return () => {
      cancelled = true
    }
  }, [hasEnglish])

  useEffect(() => {
    applyLocale(getInitialLocale(), false)
  }, [applyLocale])

  const setLocale = useCallback(
    (next: SupportedLocale) => {
      applyLocale(next, true)
    },
    [applyLocale]
  )

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  // Block first paint until at least the English fallback is ready. The inline
  // payload makes this synchronous on Vercel-deployed routes; in `vite dev` and
  // other non-prerendered hosts the dynamic import fires once and resolves
  // within the same tick the bundle is parsed.
  if (!hasEnglish) return null

  return (
    <TranslationProvider locale={locale} translations={translations} fallbackLocale="en">
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </TranslationProvider>
  )
}

function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}

export { LocaleProvider, useLocale }
export type { SupportedLocale }
