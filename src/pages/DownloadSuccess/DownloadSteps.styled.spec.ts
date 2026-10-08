type Style = Record<string, unknown>
type StyleFn = (args: { theme: unknown } & Record<string, unknown>) => Style
type CapturedStyled = { options?: { shouldForwardProp?: (prop: string) => boolean }; style: Style | StyleFn }

const mockCaptured: CapturedStyled[] = []

jest.mock('decentraland-ui2', () => ({
  styled: (_tag: unknown, options?: CapturedStyled['options']) => (style: CapturedStyled['style']) => {
    mockCaptured.push({ options, style })
    return () => null
  },
  Box: () => null,
  Typography: () => null,
  // Keeps the interpolated values, so the spec can read the blur range back out of the animation.
  keyframes: (chunks: TemplateStringsArray, ...values: unknown[]) =>
    chunks.reduce((css, chunk, index) => css + chunk + (values[index] ?? ''), ''),
  dclColors: {
    brand: { lavender: '#C640CD', ruby: '#FF2D55' },
    neutral: { softWhite: '#FCFCFC', gray5: '#ECEBED' }
  }
}))

const theme = {
  spacing: (...values: number[]) => values.map(value => `${value * 8}px`).join(' '),
  breakpoints: { up: (key: string) => `@media (min-width:${key})`, down: (key: string) => `@media (max-width:${key})` },
  palette: { common: { white: '#fff' }, primary: { light: '#f66', dark: '#a00' } }
}

const resolve = (captured: CapturedStyled, props: Record<string, unknown> = {}): Style =>
  typeof captured.style === 'function' ? captured.style({ theme, ...props }) : captured.style

// A style function may need props this lookup does not pass (e.g. the header needs `step`): skip it.
const tryResolve = (captured: CapturedStyled, props: Record<string, unknown>): Style => {
  try {
    return resolve(captured, props)
  } catch {
    return {}
  }
}

const findStyle = (predicate: (style: Style) => boolean, props: Record<string, unknown> = {}) => {
  const found = mockCaptured.find(captured => predicate(tryResolve(captured, props)))
  if (!found) throw new Error('styled definition not found')
  return resolve(found, props)
}

describe('when loading the steps styles', () => {
  beforeAll(async () => {
    await import('./DownloadSteps.styled')
  })

  describe('and building the media box', () => {
    it('should keep the 394 / 240 ratio and be the size container the highlight scales against', () => {
      const media = findStyle(style => style.containerType === 'inline-size')

      expect(media).toEqual(expect.objectContaining({ aspectRatio: '394 / 240', width: '100%' }))
    })
  })

  describe('and building the card header', () => {
    it.each([
      [0, '#673075', 'rgba(194, 92, 184, 0.32)'],
      [1, '#550F76', 'rgba(105, 0, 146, 0.52)'],
      [2, '#511B68', 'rgba(37, 0, 69, 0.41)'],
      [3, '#673075', 'rgba(194, 92, 184, 0.32)']
    ])('should tint step %s with its own accent and base color', (step, accent, base) => {
      const header = findStyle(style => typeof style.boxShadow === 'string' && String(style.boxShadow).startsWith('inset 4px'), { step })

      expect(header.boxShadow).toBe(`inset 4px 0 0 0 ${accent}`)
      expect(header.backgroundColor).toBe(base)
      expect(header.minHeight).toBe(180)
    })

    it('should keep the step index out of the DOM', () => {
      const captured = mockCaptured.find(({ options }) => options?.shouldForwardProp?.('step') === false)

      expect(captured?.options?.shouldForwardProp?.('children')).toBe(true)
    })
  })

  describe('and building the highlight', () => {
    it('should place the box by percentage and size it in container units', () => {
      const highlight = findStyle(style => style.transform === 'translate(-50%, -50%)', { x: 25, y: 75 })

      expect(highlight).toEqual(
        expect.objectContaining({ left: '25%', top: '75%', width: 'calc(220 / 394 * 100cqw)', pointerEvents: 'none' })
      )
    })

    it('should keep the position props out of the DOM', () => {
      const captured = mockCaptured.find(({ options }) => options?.shouldForwardProp?.('x') === false)

      expect(captured?.options?.shouldForwardProp?.('y')).toBe(false)
      expect(captured?.options?.shouldForwardProp?.('src')).toBe(true)
    })

    it('should size the icon disc in container units and round it', () => {
      const icon = findStyle(style => style.width === 'calc(30.52 / 394 * 100cqw)')

      expect(icon).toEqual(expect.objectContaining({ borderRadius: '50%', position: 'relative', gridArea: '1 / 1' }))
    })

    describe('and the glow', () => {
      it('should pulse for 2.1 seconds, blurred in container units', () => {
        const glow = findStyle(style => String(style.animation).includes('2.1s'))

        expect(glow.animation).toContain('infinite')
        expect(glow.filter).toBe('blur(calc(11.9 / 394 * 100cqw))')
        expect(glow.backgroundColor).toBe('#C640CD')
      })

      it('should pulse the blur between 11.9 and 23.8 (of 394) in container units, holding both ends', () => {
        const glow = findStyle(style => String(style.animation).includes('2.1s'))
        const keyframes = String(glow.animation)
        const min = 'blur(calc(11.9 / 394 * 100cqw))'
        const max = 'blur(calc(23.8 / 394 * 100cqw))'

        expect(keyframes).toMatch(new RegExp(`0%, 4\\.76% \\{\\s*filter: ${min.replace(/[().*/]/g, '\\$&')}`))
        expect(keyframes).toMatch(new RegExp(`33\\.33%, 71\\.43% \\{\\s*filter: ${max.replace(/[().*/]/g, '\\$&')}`))
        expect(keyframes).toMatch(new RegExp(`100% \\{\\s*filter: ${min.replace(/[().*/]/g, '\\$&')}`))
      })

      it('should stop animating when the user prefers reduced motion', () => {
        const glow = findStyle(style => String(style.animation).includes('2.1s'))

        expect(glow['@media (prefers-reduced-motion: reduce)']).toEqual({ animation: 'none' })
      })
    })
  })

  describe('and building the image', () => {
    it.each([['cover'], ['contain']])('should use object-fit %s and fill the media box without sizing it', fit => {
      const image = findStyle(style => style.inset === 0, { fit })

      expect(image).toEqual(expect.objectContaining({ position: 'absolute', objectFit: fit }))
    })
  })

  describe('and building the page and the cards row', () => {
    it('should share the header and media rows between the cards from the md breakpoint', () => {
      const row = findStyle(style => style.maxWidth === 1230)

      expect(row['@media (min-width:md)']).toEqual(
        expect.objectContaining({ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'auto auto' })
      )
    })

    it('should let each card span both rows and follow them', () => {
      const card = findStyle(style => style.maxWidth === 394 && style.minWidth === 0)

      expect(card['@media (min-width:md)']).toEqual(expect.objectContaining({ gridRow: 'span 2', gridTemplateRows: 'subgrid' }))
    })
  })

  describe('and building the footer link', () => {
    it('should keep hover, active and focus-visible states', () => {
      const link = findStyle(style => style.textDecoration === 'underline')

      expect(Object.keys(link)).toEqual(expect.arrayContaining(['&:hover', '&:active', '&:focus-visible']))
    })
  })

  describe('and building every style definition', () => {
    it('should produce a style object for each of them', () => {
      const styles = mockCaptured.map(captured => resolve(captured, { step: 0, x: 10, y: 20, fit: 'cover' }))

      expect(styles.length).toBeGreaterThan(10)
      styles.forEach(style => expect(typeof style).toBe('object'))
    })
  })
})
