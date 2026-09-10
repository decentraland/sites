import { render, screen } from '@testing-library/react'
import { createBlogPost } from '../../../__test-utils__/blogFixtures'
import { PostHeader } from './PostHeader'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock())

const post = createBlogPost()
const category = <span>{post.category.title}</span>

describe('when rendering a post header', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the title as a level-one heading', () => {
    render(<PostHeader title={post.title} description={post.description} publishedDate={post.publishedDate} category={category} />)

    const headings = screen.getAllByRole('heading', { level: 1 })

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(post.title)
  })

  it('should render the description as a paragraph rather than a heading', () => {
    render(<PostHeader title={post.title} description={post.description} publishedDate={post.publishedDate} category={category} />)

    expect(screen.queryByRole('heading', { name: post.description })).not.toBeInTheDocument()
    expect(screen.getByText(post.description).tagName).toBe('P')
  })

  it('should expose the raw ISO date on the time element and the formatted one to readers', () => {
    const { container } = render(
      <PostHeader title={post.title} description={post.description} publishedDate={post.publishedDate} category={category} />
    )

    const time = container.querySelector('time')

    expect(time).toHaveAttribute('datetime', post.publishedDate)
    expect(time).toHaveTextContent('Sep 04, 2026')
  })

  it('should render the category slot given by the caller', () => {
    render(<PostHeader title={post.title} description={post.description} publishedDate={post.publishedDate} category={category} />)

    expect(screen.getByText(post.category.title)).toBeInTheDocument()
  })

  // An empty `datetime` is invalid HTML, so the element has to disappear entirely.
  it('should omit the time element and its separator when there is no publish date', () => {
    const { container } = render(<PostHeader title={post.title} description={post.description} publishedDate="" category={category} />)

    expect(container.querySelector('time')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('•')
  })
})
