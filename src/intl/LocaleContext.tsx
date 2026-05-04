import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { TranslationProvider, useTranslation } from '@dcl/hooks'
import type { LanguageTranslations } from '@dcl/hooks/esm/hooks/useTranslation/useTranslation.type'

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
const inlineEn = typeof window !== 'undefined' ? window.__dclEn : undefined
const loadEnglish = (): Promise<Translations> =>
  inlineEn ? Promise.resolve(inlineEn) : import('./en.json').then(m => m.default as unknown as Translations)

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

function LocaleProvider({ children }: { children: ReactNode }) {
  // Lazy-init reads localStorage once per mount instead of on every render.
  const [initialLocale] = useState<SupportedLocale>(() => getInitialLocale())
  // First paint always uses `en` so the LCP card and navbar copy don't block on
  // a JSON roundtrip. Visitors with a non-English preference see English for a
  // few hundred ms before their locale takes over.
  const [translations, setTranslations] = useState<LanguageTranslations | null>(() => (inlineEn ? { en: inlineEn } : null))
  const [locale, setLocale] = useState<SupportedLocale>('en')

  useEffect(() => {
    let cancelled = false
    const enReady = inlineEn ? Promise.resolve(inlineEn) : loadEnglish()
    const otherReady: Promise<Translations | undefined> =
      initialLocale === 'en'
        ? Promise.resolve(undefined)
        : localeLoaders[initialLocale]()
            .then(m => m.default)
            .catch(() => undefined)
    Promise.all([enReady, otherReady]).then(([enValue, otherValue]) => {
      if (cancelled) return
      const next: LanguageTranslations = { en: enValue }
      if (otherValue) {
        next[initialLocale] = otherValue
        setLocale(initialLocale)
      }
      setTranslations(next)
    })
    return () => {
      cancelled = true
    }
  }, [initialLocale])

  // Block the first paint until at least the English fallback is ready.
  // `inlineEn` makes this synchronous on Vercel-deployed routes; in `vite
  // dev` and other non-prerendered hosts the dynamic import fires once and
  // resolves within the same tick the bundle is parsed.
  if (!translations) return null

  // No `key` on the provider: keying on `locale` would unmount the entire
  // `<App />` subtree (router state, RTK Query cache, in-flight forms) every
  // time the lazy locale chunk resolves. We rely on the provider re-deriving
  // its memoized strings from the new `translations` reference instead.
  return (
    <TranslationProvider locale={locale} translations={translations} fallbackLocale="en">
      <LocaleLoader translations={translations} setTranslations={setTranslations}>
        {children}
      </LocaleLoader>
    </TranslationProvider>
  )
}

interface LocaleLoaderProps {
  translations: LanguageTranslations
  setTranslations: (updater: (prev: LanguageTranslations | null) => LanguageTranslations) => void
  children: ReactNode
}

// Receives the imperative locale switch from `useLocale().setLocale` (via the
// `TranslationProvider` context) and lazy-loads the chunk on first switch.
function LocaleLoader({ translations, setTranslations, children }: LocaleLoaderProps) {
  const { locale } = useTranslation()

  useEffect(() => {
    if (!locale || locale === 'en' || locale in translations) return
    if (!isSupportedLocale(locale) || locale === 'en') return
    let cancelled = false
    localeLoaders[locale]()
      .then(mod => {
        if (cancelled) return
        setTranslations(prev => (prev ? { ...prev, [locale]: mod.default } : { [locale]: mod.default }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [locale, translations, setTranslations])

  return <>{children}</>
}

function useLocale() {
  const { locale, setLocale: setLocaleInternal } = useTranslation()

  const setLocale = useCallback(
    (newLocale: string) => {
      setLocaleInternal(newLocale)
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      } catch {
        // localStorage unavailable
      }
    },
    [setLocaleInternal]
  )

  return { locale: locale as SupportedLocale, setLocale }
}

export { LocaleProvider, useLocale }
export type { SupportedLocale }
