import { BLOCKS } from '@contentful/rich-text-types'
import type { Document } from '@contentful/rich-text-types'
import { render, screen } from '@testing-library/react'
import { styledMock } from '../__fixtures__/styled-mock'
import { RichText } from './RichText'

jest.mock('./RichText.renderers', () => ({
  renderEmbeddedAsset: (_node: unknown, assets: Record<string, { url: string }>) => (
    <span data-testid="mock-embedded-asset">{Object.keys(assets).join(',')}</span>
  ),
  renderHyperlink: () => <span data-testid="mock-hyperlink" />
}))

jest.mock('./RichText.styled', () =>
  styledMock({
    Blockquote: 'blockquote',
    Heading1: 'h1',
    Heading2: 'h2',
    Heading3: 'h3',
    Heading4: 'h4',
    Heading5: 'h5',
    Heading6: 'h6',
    ListItem: 'li',
    OrderedList: 'ol',
    Paragraph: 'p',
    UnorderedList: 'ul'
  })
)

const paragraphDoc: Document = {
  nodeType: 'document',
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{ nodeType: 'text', value: 'Hello body', marks: [], data: {} }]
    }
  ]
} as Document

const embeddedAssetDoc: Document = {
  nodeType: 'document',
  data: {},
  content: [
    {
      nodeType: BLOCKS.EMBEDDED_ASSET,
      data: { target: { sys: { id: 'asset-9' } } },
      content: []
    }
  ]
} as Document

describe('when rendering RichText', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the document is empty', () => {
    it('should render nothing', () => {
      const { container } = render(<RichText document={{} as Document} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('and the document contains a paragraph', () => {
    it('should render the paragraph text in a <p>', () => {
      render(<RichText document={paragraphDoc} />)
      expect(screen.getByText('Hello body').tagName).toBe('P')
    })
  })

  describe('and the document contains an embedded asset', () => {
    it('should delegate to renderEmbeddedAsset with the asset map', () => {
      render(
        <RichText
          document={embeddedAssetDoc}
          assets={{ 'asset-9': { id: 'asset-9', url: 'x', width: 1, height: 1, mimeType: 'image/png' } }}
        />
      )
      expect(screen.getByTestId('mock-embedded-asset')).toHaveTextContent('asset-9')
    })
  })
})
