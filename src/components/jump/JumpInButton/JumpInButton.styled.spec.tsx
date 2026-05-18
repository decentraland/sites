jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const passthrough = (tag: string) =>
    ReactLib.forwardRef(({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
      ReactLib.createElement(tag, { ref, ...(rest as Record<string, unknown>) }, children)
    )
  return { ...actual, Button: passthrough('button'), IconButton: passthrough('button') }
})

import { render } from '@testing-library/react'
import { JumpInIconButton, StyledJumpInButton } from './JumpInButton.styled'

describe('JumpInButton styled components', () => {
  it('renders both button variants', () => {
    render(
      <>
        <JumpInIconButton />
        <StyledJumpInButton>Jump in</StyledJumpInButton>
      </>
    )
  })
})
