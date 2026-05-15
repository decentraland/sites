// Helper to stub a `.styled.ts` module for unit tests.
// decentraland-ui2 is ESM and breaks ts-jest at module load, so each spec
// mocks both the library and the co-located styled file. Building stub
// elements by hand for every spec is noisy — this helper centralises it.

import type { ComponentType, ReactNode } from 'react'

type AnyProps = { children?: ReactNode; to?: string } & Record<string, unknown>

type StyledStubMap = Record<string, ComponentType<AnyProps>>

function passThrough(tag: keyof JSX.IntrinsicElements): ComponentType<AnyProps> {
  const Component = ({ children, to, ...rest }: AnyProps) => {
    // Lowercase JSX tag names must be uppercased to render dynamically.
    const tagName = tag
    const props = to !== undefined ? { ...rest, href: to } : rest
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const Tag: keyof JSX.IntrinsicElements = tagName
    return <Tag {...props}>{children}</Tag>
  }
  Component.displayName = `StyledStub(${tag})`
  return Component
}

// Build a stub module from a `{ exportName: 'a' | 'div' | ... }` map.
function styledMock(map: Record<string, keyof JSX.IntrinsicElements>): StyledStubMap {
  const out: StyledStubMap = {}
  for (const [name, tag] of Object.entries(map)) {
    out[name] = passThrough(tag)
  }
  return out
}

export { styledMock }
export type { StyledStubMap }
