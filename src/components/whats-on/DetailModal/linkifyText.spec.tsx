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
})
