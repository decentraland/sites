import { render } from '@testing-library/react'
import { CloseGlyph, CopyGlyph, JumpInGlyph, LiveGlyph, LiveHeadingGlyph, MedalGlyph, PinGlyph, glyphStyle } from './CardIcons'

describe('glyphStyle', () => {
  describe('when given a number', () => {
    it('should return a px height with auto width', () => {
      expect(glyphStyle(24)).toEqual({ display: 'block', height: '24px', width: 'auto' })
    })
  })

  describe('when given a CSS length string', () => {
    it('should pass the string through as the height', () => {
      expect(glyphStyle('3.982cqw')).toEqual({ display: 'block', height: '3.982cqw', width: 'auto' })
    })
  })
})

describe('CardIcons', () => {
  describe.each([
    ['LiveGlyph', LiveGlyph],
    ['MedalGlyph', MedalGlyph],
    ['PinGlyph', PinGlyph],
    ['LiveHeadingGlyph', LiveHeadingGlyph],
    ['CloseGlyph', CloseGlyph],
    ['CopyGlyph', CopyGlyph],
    ['JumpInGlyph', JumpInGlyph]
  ] as const)('when rendering %s', (_name, Glyph) => {
    it('should render an svg with a viewBox', () => {
      const { container } = render(<Glyph />)
      const svg = container.querySelector('svg')

      expect(svg).toBeInTheDocument()
      expect(svg?.getAttribute('viewBox')).toBeTruthy()
    })

    it('should size the svg height from the size prop', () => {
      const { container } = render(<Glyph size={32} />)

      expect(container.querySelector('svg')?.style.height).toBe('32px')
    })
  })

  describe('when PinGlyph receives a color', () => {
    it('should fill every path with it', () => {
      const { container } = render(<PinGlyph color="#FCFCFC" />)
      const paths = Array.from(container.querySelectorAll('path'))

      expect(paths.length).toBeGreaterThan(0)
      paths.forEach(path => expect(path.getAttribute('fill')).toBe('#FCFCFC'))
    })
  })

  describe('when PinGlyph has no color prop', () => {
    it('should default to the location pill text color', () => {
      const { container } = render(<PinGlyph />)

      expect(container.querySelector('path')?.getAttribute('fill')).toBe('#ECEBED')
    })
  })
})
