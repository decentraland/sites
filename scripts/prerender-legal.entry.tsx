/**
 * SSR entry for the legal-page prerender. Built and run by scripts/prerender-legal.mjs.
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

// Emotion serializes the whole MUI theme into <style> tags and a generated class per
// element, which is ~75% of the output and means nothing outside the SPA.
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
