import React from 'react'
import { render, screen } from '@testing-library/react'
import { PendingCloseButton, PendingDialog, PendingSpinner } from './HomeDetailModal.styled'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const passthrough = (tag: string) =>
    React.forwardRef(({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
      React.createElement(tag, { ref, ...(rest as Record<string, unknown>) }, children)
    )
  return { ...actual, CircularProgress: passthrough('div'), Dialog: passthrough('div'), IconButton: passthrough('button') }
})

describe('when rendering the home detail modal styled components', () => {
  beforeEach(() => {
    render(
      <PendingDialog open onClose={jest.fn()}>
        <PendingCloseButton aria-label="close" />
        <PendingSpinner role="progressbar" />
      </PendingDialog>
    )
  })

  it('should render the dialog, the close button and the spinner so the style callbacks execute', () => {
    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
