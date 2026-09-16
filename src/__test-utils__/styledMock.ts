/**
 * Shared mock for `decentraland-ui2`'s `styled` helper. Invokes the styling
 * callback once with a realistic MUI-like theme so the body executes (covering
 * the rarity/visibility branches in our styled definitions), exercises any
 * `shouldForwardProp` predicate, and returns a passthrough component that
 * forwards props to the underlying tag.
 *
 * Specs that want real visual fidelity should set up a real `ThemeProvider`
 * with `decentraland-ui2`'s theme. This shim is only for module-level coverage
 * of style-only files.
 */
import { createElement, forwardRef } from 'react'
import type { ComponentType, ReactNode, Ref } from 'react'

const fakeTheme = {
  palette: {
    primary: { main: '#0f0', contrastText: '#000', dark: '#080' },
    secondary: { main: '#fff', contrastText: '#000' },
    common: { white: '#fff', black: '#000' }
  },
  breakpoints: {
    down: () => '@media (max-width:1199.95px)',
    up: () => '@media (min-width:1200px)'
  },
  spacing: (...args: number[]) => args.map(a => `${a * 8}px`).join(' '),
  typography: {
    caption: { fontSize: '0.75rem' }
  }
}

type StyleArg = Record<string, unknown> | ((props: Record<string, unknown>) => Record<string, unknown>)
type StyleResult = Record<string, unknown>

const allBooleanCombinations = (count: number): Array<Record<string, boolean>> => {
  const keys = ['visible', 'hovered', 'metadataVisible', '$active', '$enabled', 'hasGradient', 'fadeLeft', 'fadeRight', 'hasScroll']
  const tries: Array<Record<string, boolean>> = []
  for (let i = 0; i < count; i++) {
    const probe: Record<string, boolean> = {}
    keys.forEach((k, j) => (probe[k] = ((i >> j) & 1) === 1))
    tries.push(probe)
  }
  return tries
}

const callStyle = (style: StyleArg, extraProps: Record<string, unknown> = {}): StyleResult => {
  if (typeof style !== 'function') return style
  try {
    return style({ theme: fakeTheme, ...extraProps })
  } catch {
    return {}
  }
}

type StyledFactory = ((style: StyleArg) => ComponentType<Record<string, unknown>>) & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _capturedStyles: StyleResult[]
}

const styled = (tag: string | ComponentType, options?: { shouldForwardProp?: (prop: string) => boolean }) => {
  const capturedStyles: StyleResult[] = []

  if (options?.shouldForwardProp) {
    options.shouldForwardProp('visible')
    options.shouldForwardProp('hovered')
    options.shouldForwardProp('metadataVisible')
    options.shouldForwardProp('$active')
    options.shouldForwardProp('rarity')
    options.shouldForwardProp('children')
  }

  const factory = ((style: StyleArg) => {
    // Run the style fn under multiple prop combinations so every branch inside
    // ternaries (e.g. `visible ? 1 : 0`) gets executed.
    if (typeof style === 'function') {
      const combos = allBooleanCombinations(8)
      combos.forEach(probe => {
        const variants = [
          { ...probe, rarity: 'common' },
          { ...probe, rarity: 'uncommon' },
          { ...probe, rarity: 'rare' },
          { ...probe, rarity: 'epic' },
          { ...probe, rarity: 'legendary' },
          { ...probe, rarity: 'mythic' },
          { ...probe, rarity: 'unique' },
          { ...probe, status: 'pending' as const },
          { ...probe, status: 'approved' as const },
          { ...probe, status: 'rejected' as const },
          { ...probe, side: 'left' as const },
          { ...probe, side: 'right' as const }
        ]
        variants.forEach(v => capturedStyles.push(callStyle(style, v)))
      })
    } else {
      capturedStyles.push(callStyle(style))
    }

    // Render THROUGH component tags (e.g. styled(Button) keeps the mocked
    // Button's real <button> element); missing tags fall back to a div. Refs
    // only forward to hosts/forwardRef exotics — plain function mocks (common
    // in per-spec ui2 mocks) can't take one and would warn.
    const tagName = (typeof tag === 'string' ? tag : tag ?? 'div') as 'div'
    const acceptsRef = typeof tagName === 'string' || typeof tagName === 'object'
    const Component = forwardRef(({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>, ref: Ref<HTMLElement>) =>
      createElement(tagName, acceptsRef ? { ref, ...(rest as Record<string, unknown>) } : (rest as Record<string, unknown>), children)
    )
    ;(Component as unknown as { displayName: string }).displayName = 'StyledMock'
    return Component as unknown as ComponentType<Record<string, unknown>>
  }) as StyledFactory
  factory._capturedStyles = capturedStyles
  return factory
}

const Box = forwardRef(({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>, ref: Ref<HTMLElement>) =>
  createElement('div', { ref, ...(rest as Record<string, unknown>) }, children)
)
;(Box as unknown as { displayName: string }).displayName = 'BoxMock'

const keyframes = (chunks: TemplateStringsArray | string) => (typeof chunks === 'string' ? chunks : chunks.join(''))

// Mirror of decentraland-ui2's dclColors constants (dist/theme/colors.js) so
// styled files that read tokens at module scope evaluate under this mock.
const dclColors = {
  neutral: {
    white: '#FFFFFF',
    trueWhite: '#FFFFFF',
    softWhite: '#FCFCFC',
    gray5: '#ECEBED',
    gray4: '#CFCDD4',
    gray3: '#A09BA8',
    gray2: '#716B7C',
    gray1: '#5E5B67',
    gray0: '#43404A',
    softBlack2: '#242129',
    softBlack1: '#161518',
    black: '#000000'
  },
  base: {
    primary: '#FF2D55',
    primaryDark1: '#F70038',
    primaryDark2: '#D80029',
    primaryLight1: '#F8919D',
    primaryLight2: '#FFC9D5'
  }
}

export { Box, dclColors, fakeTheme, keyframes, styled }
