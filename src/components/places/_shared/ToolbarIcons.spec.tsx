import { render } from '@testing-library/react'
import { BrowseGlyph, FavoriteGlyph, MyPlacesGlyph, SearchGlyph } from './ToolbarIcons'

describe('ToolbarIcons', () => {
  describe.each([
    ['BrowseGlyph', BrowseGlyph],
    ['FavoriteGlyph', FavoriteGlyph],
    ['MyPlacesGlyph', MyPlacesGlyph],
    ['SearchGlyph', SearchGlyph]
  ] as const)('when rendering %s', (_name, Glyph) => {
    it('should render an svg with a viewBox', () => {
      const { container } = render(<Glyph />)
      const svg = container.querySelector('svg')

      expect(svg).toBeInTheDocument()
      expect(svg?.getAttribute('viewBox')).toBeTruthy()
    })

    it('should size the svg height from the size prop', () => {
      const { container } = render(<Glyph size={20} />)

      expect(container.querySelector('svg')?.style.height).toBe('20px')
    })

    it('should paint the glyph with the color prop', () => {
      const { container } = render(<Glyph color="#123456" />)
      const painted = container.querySelector('[stroke="#123456"], [fill="#123456"]')

      expect(painted).toBeInTheDocument()
    })
  })

  describe('when SearchGlyph has no color prop', () => {
    it('should default to snow', () => {
      const { container } = render(<SearchGlyph />)

      expect(container.querySelector('path')?.getAttribute('fill')).toBe('#FCFCFC')
    })
  })

  describe('when BrowseGlyph has no color prop', () => {
    it('should default to the active-tab dark color', () => {
      const { container } = render(<BrowseGlyph />)

      expect(container.querySelector('circle')?.getAttribute('stroke')).toBe('#161518')
    })
  })
})
