import { render, screen } from '@testing-library/react'
import { styledMock } from '../__fixtures__/styled-mock'
import { CategoryHero } from './CategoryHero'

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children, ...rest }: { children: React.ReactNode }) => <span {...rest}>{children}</span>
}))

jest.mock('./CategoryHero.styled', () => {
  const styled = styledMock({ HeroContent: 'div', HeroTitle: 'h3' })
  return {
    ...styled,
    HeroContainer: ({ children, imageUrl, ...rest }: { children?: React.ReactNode; imageUrl?: string } & Record<string, unknown>) => (
      <div data-image-url={imageUrl} {...(rest as object)}>
        {children}
      </div>
    )
  }
})

describe('when rendering CategoryHero', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and category, description, and image are provided', () => {
    it('should render the category title as a heading', () => {
      render(<CategoryHero category="Announcements" description="The latest news" image="https://fake-cdn.test/cat.png" />)
      expect(screen.getByText('Announcements')).toBeInTheDocument()
    })

    it('should render the description text', () => {
      render(<CategoryHero category="Announcements" description="The latest news" image="https://fake-cdn.test/cat.png" />)
      expect(screen.getByText('The latest news')).toBeInTheDocument()
    })

    it('should forward the background image url to the hero container', () => {
      const { container } = render(<CategoryHero category="Announcements" description="x" image="https://fake-cdn.test/cat.png" />)
      expect(container.querySelector('[data-image-url="https://fake-cdn.test/cat.png"]')).toBeInTheDocument()
    })
  })
})
