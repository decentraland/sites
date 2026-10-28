import { fireEvent, render } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { CreatorsCreate } from './CreateCards'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return { ...actual, Typography, useMediaQuery: jest.fn() }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

// AnimatedSection transitively imports @dcl/hooks (ESM); stub it to a passthrough
// so this spec covers only CreateCards' own wiring. Its own spec covers the
// section-viewed behavior.
jest.mock('../AnimatedSection', () => ({
  AnimatedSection: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
}))

// Render the carousel items inline so the per-card CTAs are reachable.
jest.mock('../../Carousel', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Carousel: ({ items, renderItem, keyExtractor }: any) => (
    <div>
      {items.map((item: unknown) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  )
}))

const mockTrackClick = jest.mocked(useTrackClick)
const trackClick = jest.fn()

const mockMediaQuery = jest.mocked(useMediaQuery)

describe('CreatorsCreate', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
    mockMediaQuery.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a useful-links resource is rendered', () => {
    it('should tag each link with the Creators Create place plus its card and tab context', () => {
      const { container } = render(<CreatorsCreate />)

      const links = container.querySelectorAll('a[data-title]')
      expect(links.length).toBeGreaterThan(0)
      links.forEach(link => {
        expect(link).toHaveAttribute('data-place', 'Creators Create')
        expect(link).toHaveAttribute('data-card')
        expect(link).toHaveAttribute('data-tab')
      })
    })

    it('should fire the click adapter when a resource link is clicked', () => {
      const { container } = render(<CreatorsCreate />)

      const link = container.querySelector('a[data-title]') as HTMLElement
      fireEvent.click(link)

      expect(trackClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the experiences card renders', () => {
    it('should default to the Create Scenes tab with links into the scene docs', () => {
      const { container } = render(<CreatorsCreate />)

      expect(
        container.querySelector('a[href="https://docs.decentraland.org/creator/scene-editor/get-started/about-editor"]')
      ).toBeInTheDocument()
      expect(
        container.querySelector('a[href="https://docs.decentraland.org/creator/scene-editor/publish/publish-scene"]')
      ).toBeInTheDocument()
    })
  })

  describe('when rendered on desktop', () => {
    it('should include the Creator Hub download links', () => {
      const { container } = render(<CreatorsCreate />)

      expect(container.querySelectorAll('a[href="/download/creator-hub"]').length).toBeGreaterThan(0)
    })
  })

  describe('when rendered on mobile', () => {
    beforeEach(() => {
      mockMediaQuery.mockReturnValue(true)
    })

    it('should hide the desktop-only Creator Hub download links', () => {
      const { container } = render(<CreatorsCreate />)

      expect(container.querySelectorAll('a[href="/download/creator-hub"]').length).toBe(0)
    })

    it('should keep the links that work on a phone', () => {
      const { container } = render(<CreatorsCreate />)

      expect(
        container.querySelector('a[href="https://docs.decentraland.org/creator/scene-editor/get-started/about-editor"]')
      ).toBeInTheDocument()
    })
  })

  describe('when a card exposes tabs', () => {
    it('should track a tab switch and reveal the selected tab content', () => {
      const { container } = render(<CreatorsCreate />)

      const tabButtons = container.querySelectorAll('button[data-tab]')
      // Data fixtures include at least one multi-tab card.
      expect(tabButtons.length).toBeGreaterThan(1)

      // Click both the first and the second tab so each onClick handler runs.
      fireEvent.click(tabButtons[1])
      fireEvent.click(tabButtons[0])

      expect(trackClick).toHaveBeenCalledTimes(2)
      tabButtons.forEach(button => {
        expect(button).toHaveAttribute('data-place', 'Creators Create')
        expect(button).toHaveAttribute('data-card')
      })
    })
  })
})
