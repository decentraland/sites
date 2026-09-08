import type { ElementType } from 'react'

/**
 * `styled(Typography)` erases MUI's polymorphic `component` overload, so any styled
 * Typography that needs to pick its own tag has to re-declare the prop. Used to keep a
 * visual type scale (`variant`) independent from the semantic element the outline needs.
 */
interface PolymorphicTypographyProps {
  component?: ElementType
}

export type { PolymorphicTypographyProps }
