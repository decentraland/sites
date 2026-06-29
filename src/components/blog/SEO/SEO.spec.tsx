import { HelmetProvider } from 'react-helmet-async'
import { render, waitFor } from '@testing-library/react'
import { OGType, SEO } from './SEO'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../config/env', () => ({
  getEnv: (key: string) => (key === 'BLOG_BASE_URL' ? 'https://decentraland.org/blog' : undefined)
}))

function renderWithHelmet(ui: React.ReactElement) {
  return render(<HelmetProvider>{ui}</HelmetProvider>)
}

function getMeta(name: string): HTMLMetaElement | null {
  return document.querySelector(`meta[property="${name}"]`) ?? document.querySelector(`meta[name="${name}"]`)
}

function clearHelmetHead() {
  document.head.querySelectorAll('[data-rh="true"]').forEach(el => el.remove())
  document.title = ''
}

describe('when rendering SEO', () => {
  afterEach(() => {
    jest.resetAllMocks()
    clearHelmetHead()
  })

  describe('and a title is provided', () => {
    it('should append the site name suffix to the document title', async () => {
      renderWithHelmet(<SEO title="A Post" description="desc" />)
      await waitFor(() => expect(document.title).toBe('A Post | Decentraland'))
    })
  })

  describe('and no title is provided', () => {
    it('should use the site name as the title', async () => {
      renderWithHelmet(<SEO description="desc" />)
      await waitFor(() => expect(document.title).toBe('Decentraland'))
    })
  })

  describe('and a description is provided', () => {
    it('should set the description meta tag', async () => {
      renderWithHelmet(<SEO description="A description" />)
      await waitFor(() => expect(getMeta('description')?.getAttribute('content')).toBe('A description'))
    })
  })

  describe('and the type is ARTICLE', () => {
    it('should emit article-specific meta tags from the provided props', async () => {
      renderWithHelmet(
        <SEO
          title="Post"
          description="desc"
          type={OGType.ARTICLE}
          author="Ada"
          publishedTime="2026-01-01T00:00:00.000Z"
          section="Announcements"
          tags={['react', 'web3']}
        />
      )
      await waitFor(() => expect(getMeta('article:author')?.getAttribute('content')).toBe('Ada'))
      expect(getMeta('article:published_time')?.getAttribute('content')).toBe('2026-01-01T00:00:00.000Z')
      expect(getMeta('article:section')?.getAttribute('content')).toBe('Announcements')
      expect(document.querySelectorAll('meta[property="article:tag"]').length).toBe(2)
    })
  })

  describe('and an absolute url is provided', () => {
    it('should set the canonical link to that absolute url', async () => {
      renderWithHelmet(<SEO title="Post" description="desc" url="https://example.test/blog/post" />)
      await waitFor(() =>
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://example.test/blog/post')
      )
    })
  })

  describe('and a string image is provided', () => {
    it('should expose it as the og:image and twitter:image meta tags', async () => {
      renderWithHelmet(<SEO title="Post" description="desc" image="https://fake-cdn.test/og.png" />)
      await waitFor(() => expect(getMeta('og:image')?.getAttribute('content')).toBe('https://fake-cdn.test/og.png'))
      expect(getMeta('twitter:image')?.getAttribute('content')).toBe('https://fake-cdn.test/og.png')
    })
  })
})
