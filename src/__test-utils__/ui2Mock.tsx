import { createElement } from 'react'
import type { ReactNode } from 'react'
import { Box, dclColors, fakeTheme, keyframes, styled } from './styledMock'

/**
 * Shared `decentraland-ui2` stub for specs that assert semantic markup rather than styling.
 *
 * The important part is `Typography`: it mirrors MUI by letting `component` win over the
 * variant-derived tag, so a spec can prove a title really renders as an `<h1>`. Note the
 * fallback is `span`, so an un-`component`ed Typography collapses to a `<span>` here and
 * these specs cannot detect heading regressions on elements they don't explicitly set.
 *
 * Call it from inside the `jest.mock` factory via `jest.requireActual`, which is allowed
 * where a plain out-of-scope reference would be hoisted away.
 */
const createUi2Mock = () => ({
  Box,
  dclColors,
  fakeTheme,
  keyframes,
  styled,

  Card: Box,

  Typography: ({ component, children, ...rest }: { component?: string; children?: ReactNode }) =>
    createElement(component ?? 'span', rest, children),

  CircularProgress: () => createElement('div', { role: 'progressbar' }),

  Skeleton: () => createElement('div', { role: 'progressbar' })
})

export { createUi2Mock }
