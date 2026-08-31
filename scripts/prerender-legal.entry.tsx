/**
 * SSR entry for the legal-page prerender. Built by `vite build --ssr` and run by
 * scripts/prerender-legal.mjs — see that file for why the artifacts exist.
 *
 * Each entry renders the SAME component the SPA renders, so the prerendered text
 * cannot drift from what a browser shows.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { ContentPolicy } from '../src/pages/content'
import { PrivacyPolicy } from '../src/pages/privacy'
import { TermsOfUse } from '../src/pages/terms'

const PAGES = [
  { slug: 'content', element: <ContentPolicy /> },
  { slug: 'privacy', element: <PrivacyPolicy /> },
  { slug: 'terms', element: <TermsOfUse /> }
] as const

// Emotion serializes the whole MUI theme into <style data-emotion> tags and tags
// every element with a generated class. None of it means anything outside the SPA,
// and it is ~75% of the payload the worker would have to inject. Strip it so the
// artifact is semantic HTML: its consumers read the text, they don't paint it.
const stripPresentation = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/ class="[^"]*"/g, '')
    .replace(/ style="[^"]*"/g, '')

export const render = (): { slug: string; html: string }[] =>
  PAGES.map(({ slug, element }) => ({
    slug,
    html: stripPresentation(
      renderToStaticMarkup(
        <DclThemeProvider theme={darkTheme}>
          <MemoryRouter initialEntries={[`/${slug}`]}>{element}</MemoryRouter>
        </DclThemeProvider>
      )
    )
  }))
