import React from 'react'
import { render, screen } from '@testing-library/react'
import { createBlogPost } from '../../__test-utils__/blogFixtures'
import { PreviewPage } from './PreviewPage'

const mockUseGetBlogPostPreviewQuery = jest.fn()
let searchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParams]
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (id: string) => id })
}))

jest.mock('../../components/blog/BlogLayout', () => ({
  BlogLayout: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children)
}))

jest.mock('../../components/blog/RichText', () => ({
  RichText: () => React.createElement('p', null, 'body')
}))

jest.mock('../../features/cms/cms.client', () => ({
  useGetBlogPostPreviewQuery: (...args: unknown[]) => mockUseGetBlogPostPreviewQuery(...args)
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/ui2Mock').createUi2Mock())

const post = createBlogPost({ title: 'A draft post' })

describe('when previewing a draft post', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams({ contentful_id: 'abc', contentful_env: 'master', token: 'preview-token' })
    mockUseGetBlogPostPreviewQuery.mockReturnValue({ data: post, isLoading: false, error: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the draft title as the only level-one heading', () => {
    render(<PreviewPage />)

    const headings = screen.getAllByRole('heading', { level: 1 })

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(post.title)
  })

  it('should render the description as a paragraph rather than a heading', () => {
    render(<PreviewPage />)

    expect(screen.getByText(post.description).tagName).toBe('P')
  })

  it('should wrap the draft in an article landmark with a machine-readable date', () => {
    const { container } = render(<PreviewPage />)

    expect(container.querySelector('article')).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveAttribute('datetime', post.publishedDate)
  })
})

describe('when the preview parameters are incomplete', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams({ contentful_id: 'abc', contentful_env: 'master' })
    mockUseGetBlogPostPreviewQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the missing-params copy instead of an article', () => {
    const { container } = render(<PreviewPage />)

    expect(screen.getByText('preview.missing_params')).toBeInTheDocument()
    expect(container.querySelector('article')).not.toBeInTheDocument()
  })
})
