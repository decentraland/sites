jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const passthrough = (tag: string) =>
    ReactLib.forwardRef(({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
      ReactLib.createElement(tag, { ref, ...(rest as Record<string, unknown>) }, children)
    )
  return { ...actual, Button: passthrough('button'), Typography: passthrough('p'), dclColors: { neutral: { softWhite: '#FCFCFC' } } }
})

import { render } from '@testing-library/react'
import {
  EmptyStateBody,
  EmptyStateBox,
  EmptyStateButton,
  EmptyStateIcon,
  EmptyStateSubtitle,
  EmptyStateTitle
} from './ProfileEmptyState.styled'

describe('ProfileEmptyState styled components', () => {
  it('should render every styled primitive', () => {
    render(
      <EmptyStateBox>
        <EmptyStateIcon />
        <EmptyStateBody>
          <EmptyStateTitle>Title</EmptyStateTitle>
          <EmptyStateSubtitle>Subtitle</EmptyStateSubtitle>
          <EmptyStateButton>CTA</EmptyStateButton>
        </EmptyStateBody>
      </EmptyStateBox>
    )
  })
})
