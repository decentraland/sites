import { BLOCKS, INLINES } from '@contentful/rich-text-types'
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

// Helper to build a Document with a single block node containing a text node.
// Keeps each per-node test below to a one-line setup.
function singleBlockDoc(nodeType: string, value = 'sample'): Document {
  return {
    nodeType: 'document',
    data: {},
    content: [{ nodeType, data: {}, content: [{ nodeType: 'text', value, marks: [], data: {} }] }]
  } as Document
}

// List documents wrap LIST_ITEM nodes inside UL_LIST or OL_LIST. The list-item
// itself wraps a paragraph by Contentful's convention.
function singleListItemDoc(listType: string, value = 'item'): Document {
  return {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: listType,
        data: {},
        content: [
          {
            nodeType: BLOCKS.LIST_ITEM,
            data: {},
            content: [
              {
                nodeType: BLOCKS.PARAGRAPH,
                data: {},
                content: [{ nodeType: 'text', value, marks: [], data: {} }]
              }
            ]
          }
        ]
      }
    ]
  } as Document
}

const paragraphDoc = singleBlockDoc(BLOCKS.PARAGRAPH, 'Hello body')

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

const hyperlinkDoc: Document = {
  nodeType: 'document',
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: INLINES.HYPERLINK,
          data: { uri: 'https://decentraland.org' },
          content: [{ nodeType: 'text', value: 'link text', marks: [], data: {} }]
        }
      ]
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

  describe('and the document contains a hyperlink', () => {
    it('should delegate to renderHyperlink', () => {
      render(<RichText document={hyperlinkDoc} />)
      expect(screen.getByTestId('mock-hyperlink')).toBeInTheDocument()
    })
  })

  describe.each([
    [BLOCKS.HEADING_1, 'H1'],
    [BLOCKS.HEADING_2, 'H2'],
    [BLOCKS.HEADING_3, 'H3'],
    [BLOCKS.HEADING_4, 'H4'],
    [BLOCKS.HEADING_5, 'H5'],
    [BLOCKS.HEADING_6, 'H6']
  ])('and the document contains a %s block', (block, tagName) => {
    it(`should render the content as a <${tagName.toLowerCase()}>`, () => {
      render(<RichText document={singleBlockDoc(block, `heading-${tagName}`)} />)
      expect(screen.getByText(`heading-${tagName}`).tagName).toBe(tagName)
    })
  })

  describe('and the document contains a blockquote', () => {
    it('should render the content as a <blockquote>', () => {
      render(<RichText document={singleBlockDoc(BLOCKS.QUOTE, 'quoted text')} />)
      expect(screen.getByText('quoted text').tagName).toBe('BLOCKQUOTE')
    })
  })

  describe('and the document contains an unordered list', () => {
    it('should render the list as a <ul> with a nested <li>', () => {
      render(<RichText document={singleListItemDoc(BLOCKS.UL_LIST, 'bullet')} />)
      const li = screen.getByText('bullet').closest('li')
      expect(li).not.toBeNull()
      expect(li?.parentElement?.tagName).toBe('UL')
    })
  })

  describe('and the document contains an ordered list', () => {
    it('should render the list as an <ol> with a nested <li>', () => {
      render(<RichText document={singleListItemDoc(BLOCKS.OL_LIST, 'numbered')} />)
      const li = screen.getByText('numbered').closest('li')
      expect(li).not.toBeNull()
      expect(li?.parentElement?.tagName).toBe('OL')
    })
  })
})
