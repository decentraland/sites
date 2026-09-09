/**
 * `styled(Typography)` erases MUI's polymorphic `component` overload, so any styled
 * Typography that needs to pick its own tag has to re-declare the prop. Used to keep a
 * visual type scale (`variant`) independent from the semantic element the outline needs.
 *
 * The union is deliberately narrow. A full polymorphic type would also check element-specific
 * attributes, but `styled()` has already erased the overload that would carry them, so the
 * next best guarantee is to stop the prop from accepting elements whose attributes we could
 * not type anyway (`a`, `img`, `input`).
 */
type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'

interface PolymorphicTypographyProps {
  component?: TypographyElement
}

export type { PolymorphicTypographyProps }
