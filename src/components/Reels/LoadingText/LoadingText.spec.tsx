import { render, screen } from '@testing-library/react'
import { LoadingText } from './LoadingText'

jest.mock('@emotion/react', () => ({
  keyframes: () => ''
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  styled: () => () => (props: { children?: React.ReactNode }) => <div {...(props as object)}>{props.children}</div>
}))

describe('LoadingText', () => {
  it('should render a single skeleton line by default', () => {
    render(<LoadingText type="span" size="medium" />)
    expect(screen.getAllByTestId('reels-loading-text')).toHaveLength(1)
  })

  it('should render the requested number of lines', () => {
    render(<LoadingText type="p" size="full" lines={3} />)
    expect(screen.getAllByTestId('reels-loading-text')).toHaveLength(3)
  })
})
