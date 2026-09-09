import React from 'react'
import { render, screen } from '@testing-library/react'
import { createBlogPost } from '../../../__test-utils__/blogFixtures'
import { MainPostCard } from './MainPostCard'

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => React.createElement('a', { href: to, ...rest }, children)
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock())

const post = createBlogPost()

describe('when rendering the main post card', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  // The CMS mapper hands over the raw ISO date; formatting is this component's job.
  it('should format the ISO publish date for readers', () => {
    render(<MainPostCard post={post} />)

    expect(screen.getByText('Sep 04, 2026')).toBeInTheDocument()
    expect(screen.queryByText(post.publishedDate)).not.toBeInTheDocument()
  })

  it('should render the title as a level-two heading linking to the post', () => {
    render(<MainPostCard post={post} />)

    const heading = screen.getByRole('heading', { level: 2, name: post.title })

    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', post.url)
  })

  it('should render the description', () => {
    render(<MainPostCard post={post} />)

    expect(screen.getByText(post.description)).toBeInTheDocument()
  })

  it('should render a loading skeleton instead of the post', () => {
    render(<MainPostCard loading />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })

  it('should render nothing when there is no post', () => {
    const { container } = render(<MainPostCard />)

    expect(container).toBeEmptyDOMElement()
  })
})
