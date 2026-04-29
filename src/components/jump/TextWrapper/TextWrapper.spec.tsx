import { render, screen } from '@testing-library/react'
import { TextWrapper } from './TextWrapper'

jest.mock('decentraland-ui2', () => {
  const Box = ({ children, ...props }: { children?: React.ReactNode }) => <div {...props}>{children}</div>
  return {
    Box,
    styled: (tag: unknown) => () => tag
  }
})

describe('TextWrapper', () => {
  describe('when it is rendered with children', () => {
    it('should render the children', () => {
      render(
        <TextWrapper maxHeight={100} gradientColor="#000">
          <p>Hello</p>
        </TextWrapper>
      )
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })
})
