/**
 * Rich `decentraland-ui2` mock for the /creators/world page specs. It layers the
 * shared `styledMock` (so real `*.styled.ts` files execute and count toward
 * coverage) with the handful of UI primitives + the `dclColors` token object the
 * creators pages and their styled files reference. Using this in a spec means
 * the page renders its REAL styled components (as passthrough elements) and the
 * style callbacks run — no per-styled-file mock needed.
 */
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { Box, fakeTheme, keyframes, styled } from './styledMock'

// Recursive proxy so any token path (`dclColors.neutral.softWhite`,
// `dclColors.whiteTransparent.subtle`, …) resolves, and coerces to a color
// string when interpolated into a template literal.
const makeColorProxy = (): unknown =>
  new Proxy(
    {},
    {
      get: (_target, key) => {
        if (key === Symbol.toPrimitive || key === 'toString' || key === 'valueOf') return () => '#000000'
        return makeColorProxy()
      }
    }
  )

const dclColors = makeColorProxy()

type AnyProps = Record<string, unknown> & { children?: ReactNode }

// MUI-only props that must not reach the DOM (they'd trigger React unknown-prop
// warnings). Dropped before spreading the rest onto the host element.
const NON_DOM_PROPS = new Set(['startIcon', 'endIcon', 'disableRipple', 'variant', 'color', 'size', 'fullWidth', 'disableElevation'])
const domProps = (props: AnyProps): AnyProps => Object.fromEntries(Object.entries(props).filter(([key]) => !NON_DOM_PROPS.has(key)))

const Typography = ({ children, ...rest }: AnyProps) => createElement('span', domProps(rest), children)
const Button = ({ children, onClick, disabled, ...rest }: AnyProps & { onClick?: () => void; disabled?: boolean }) =>
  createElement('button', { onClick, disabled, ...domProps(rest) }, children)
const CircularProgress = (props: AnyProps) => createElement('div', { role: 'progressbar', ...props })

interface TabProps {
  value?: unknown
  label?: ReactNode
  onClick?: () => void
}
const Tab = ({ label, onClick }: TabProps) => createElement('button', { role: 'tab', onClick }, label)

interface TabsProps {
  value?: unknown
  onChange?: (event: unknown, value: unknown) => void
  children?: ReactNode
  ['aria-label']?: string
}
// Clones each <Tab> so clicking it bubbles its `value` up through `onChange`,
// mirroring MUI's Tabs contract closely enough for the AuthServerPage switch test.
const Tabs = ({ onChange, children, ...rest }: TabsProps) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require('react') as typeof import('react')
  const mapped = react.Children.map(children, child =>
    react.isValidElement<TabProps>(child) ? react.cloneElement(child, { onClick: () => onChange?.(null, child.props.value) }) : child
  )
  return createElement('div', { role: 'tablist', ...rest }, mapped)
}

export { Box, Button, CircularProgress, dclColors, fakeTheme, keyframes, styled, Tab, Tabs, Typography }
