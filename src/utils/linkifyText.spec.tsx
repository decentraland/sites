import { render, screen } from '@testing-library/react'
import { linkifyText } from './linkifyText'

describe('linkifyText', () => {
  describe('when text has no URLs', () => {
    it('should return the original text', () => {
      const result = linkifyText('hello world')
      expect(result).toBe('hello world')
    })
  })

  describe('when text contains a single https URL', () => {
    beforeEach(() => {
      render(<div>{linkifyText('Visit https://decentraland.org for more')}</div>)
    })

    it('should render an anchor with the URL as href', () => {
      const link = screen.getByRole('link', { name: 'https://decentraland.org' })
      expect(link).toHaveAttribute('href', 'https://decentraland.org')
    })

    it('should open the link in a new tab', () => {
      const link = screen.getByRole('link', { name: 'https://decentraland.org' })
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should set rel="noopener noreferrer" for security', () => {
      const link = screen.getByRole('link', { name: 'https://decentraland.org' })
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should preserve surrounding text', () => {
      expect(screen.getByText(/Visit/)).toBeInTheDocument()
      expect(screen.getByText(/for more/)).toBeInTheDocument()
    })
  })

  describe('when text contains multiple URLs', () => {
    it('should render every URL as a link', () => {
      render(<div>{linkifyText('First https://a.example.com then https://b.example.com')}</div>)
      expect(screen.getAllByRole('link')).toHaveLength(2)
    })
  })

  describe('when URL ends with trailing punctuation', () => {
    it('should not include the punctuation in the href', () => {
      render(<div>{linkifyText('Check https://decentraland.org.')}</div>)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org')
    })
  })

  describe('when text contains a javascript: URI', () => {
    it('should not render it as a link', () => {
      render(<div>{linkifyText('javascript:alert(1)')}</div>)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('when a URL contains balanced parentheses', () => {
    it('should preserve the closing paren', () => {
      render(<div>{linkifyText('Read https://en.wikipedia.org/wiki/Foo_(bar) here')}</div>)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Foo_(bar)')
    })
  })

  describe('when a URL is wrapped in parentheses', () => {
    it('should not include the closing paren in the href', () => {
      render(<div>{linkifyText('Reference (https://decentraland.org) included')}</div>)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org')
    })
  })

  describe('when invoked twice', () => {
    it('should not leak regex state between calls', () => {
      const text = 'Visit https://decentraland.org now'
      render(
        <div>
          <div data-testid="first">{linkifyText(text)}</div>
          <div data-testid="second">{linkifyText(text)}</div>
        </div>
      )
      expect(screen.getAllByRole('link')).toHaveLength(2)
    })
  })

  describe('when two URLs are pasted back-to-back without whitespace', () => {
    beforeEach(() => {
      render(<div>{linkifyText('Visit https://a.example.com)https://b.example.com.')}</div>)
    })

    it('should render each URL as its own link', () => {
      expect(screen.getAllByRole('link')).toHaveLength(2)
    })

    it('should keep each href limited to its own domain', () => {
      const links = screen.getAllByRole('link')
      expect(links[0]).toHaveAttribute('href', 'https://a.example.com')
      expect(links[1]).toHaveAttribute('href', 'https://b.example.com')
    })
  })

  describe('when a URL is followed by another protocol after a dot', () => {
    it('should split the two URLs', () => {
      render(<div>{linkifyText('https://a.example.com.https://b.example.com')}</div>)
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      expect(links[0]).toHaveAttribute('href', 'https://a.example.com')
      expect(links[1]).toHaveAttribute('href', 'https://b.example.com')
    })
  })

  describe('when text contains a bare domain without protocol', () => {
    it('should not render it as a link', () => {
      render(<div>{linkifyText('Go to decentraland.org/builder')}</div>)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('when text preserves newlines', () => {
    it('should keep the newlines around links', () => {
      render(<pre>{linkifyText('line one\nhttps://decentraland.org\nline three')}</pre>)
      expect(screen.getByRole('link')).toHaveTextContent('https://decentraland.org')
      expect(screen.getByText(/line one/)).toBeInTheDocument()
      expect(screen.getByText(/line three/)).toBeInTheDocument()
    })
  })

  describe('when text contains a markdown-style link', () => {
    beforeEach(() => {
      render(<div>{linkifyText('[Visit the blog](https://decentraland.org/blog) for details')}</div>)
    })

    it('should render the label as the link text, not the URL', () => {
      const link = screen.getByRole('link', { name: 'Visit the blog' })
      expect(link).toHaveAttribute('href', 'https://decentraland.org/blog')
    })

    it('should not render the surrounding brackets or parentheses', () => {
      expect(screen.queryByText(/\[Visit/)).not.toBeInTheDocument()
      expect(screen.queryByText(/\)/)).not.toBeInTheDocument()
    })

    it('should preserve text after the link', () => {
      expect(screen.getByText(/for details/)).toBeInTheDocument()
    })
  })

  describe('when text contains a markdown link with an unsafe protocol', () => {
    it('should leave the literal markdown text in place', () => {
      render(<div>{linkifyText('[click](javascript:alert(1)) ignore')}</div>)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('when text contains an emoji shortcode', () => {
    it('should replace the shortcode with the matching emoji', () => {
      render(<div>{linkifyText(':popcorn: movie night :tada:')}</div>)
      expect(screen.getByText('🍿 movie night 🎉')).toBeInTheDocument()
    })

    it('should leave unknown shortcodes untouched', () => {
      render(<div>{linkifyText(':not_a_real_emoji: still here')}</div>)
      expect(screen.getByText(':not_a_real_emoji: still here')).toBeInTheDocument()
    })

    it('should resolve shortcodes inside markdown link labels', () => {
      render(<div>{linkifyText('[:popcorn: blog](https://decentraland.org/blog)')}</div>)
      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('🍿 blog')
    })

    it('should resolve shortcodes alongside plain URLs', () => {
      render(<div>{linkifyText(':popcorn: see https://decentraland.org for more')}</div>)
      expect(screen.getByText(/🍿 see/)).toBeInTheDocument()
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://decentraland.org')
      expect(screen.getByText(/for more/)).toBeInTheDocument()
    })
  })
})
