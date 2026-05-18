import { act, fireEvent, render, screen } from '@testing-library/react'
import { TextWrapper } from './TextWrapper'

jest.mock('./TextWrapper.styled', () => {
  const Container = ({
    children,
    hasGradient,
    maxHeight,
    gradientColor
  }: {
    children: React.ReactNode
    hasGradient: boolean
    maxHeight: number
    gradientColor: string
  }) => (
    <div data-testid="text-wrapper" data-has-gradient={hasGradient} data-max-height={maxHeight} data-gradient-color={gradientColor}>
      {children}
    </div>
  )

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const Content = ReactLib.forwardRef(({ children }: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => (
    <div data-testid="text-content" ref={ref}>
      {children}
    </div>
  ))

  return { TextWrapperContainer: Container, TextContent: Content }
})

describe('TextWrapper', () => {
  let scrollHeightSpy: jest.SpyInstance
  let clientHeightSpy: jest.SpyInstance
  let scrollTopSpy: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    scrollHeightSpy = jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200)
    clientHeightSpy = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100)
    scrollTopSpy = jest.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(0)
  })

  afterEach(() => {
    jest.useRealTimers()
    scrollHeightSpy.mockRestore()
    clientHeightSpy.mockRestore()
    scrollTopSpy.mockRestore()
  })

  describe('when content overflows the container', () => {
    it('should enable the gradient overlay', () => {
      render(
        <TextWrapper maxHeight={100} gradientColor="#000">
          <p>Hello</p>
        </TextWrapper>
      )
      act(() => {
        jest.advanceTimersByTime(600)
      })
      expect(screen.getByTestId('text-wrapper')).toHaveAttribute('data-has-gradient', 'true')
    })

    it('should hide the gradient when scrolled to the bottom', () => {
      render(
        <TextWrapper maxHeight={100} gradientColor="#000">
          <p>Hello</p>
        </TextWrapper>
      )
      scrollTopSpy.mockReturnValue(100)
      act(() => {
        jest.advanceTimersByTime(600)
      })
      const content = screen.getByTestId('text-content')
      fireEvent.scroll(content)
      expect(screen.getByTestId('text-wrapper')).toHaveAttribute('data-has-gradient', 'false')
    })
  })

  describe('when content fits without overflow', () => {
    beforeEach(() => {
      scrollHeightSpy.mockReturnValue(80)
    })

    it('should not enable the gradient overlay', () => {
      render(
        <TextWrapper maxHeight={100} gradientColor="#000">
          <p>Short</p>
        </TextWrapper>
      )
      act(() => {
        jest.advanceTimersByTime(600)
      })
      expect(screen.getByTestId('text-wrapper')).toHaveAttribute('data-has-gradient', 'false')
    })
  })

  describe('when the component unmounts before the timeout fires', () => {
    it('should clean up the timer without throwing', () => {
      const { unmount } = render(
        <TextWrapper maxHeight={100} gradientColor="#000">
          <p>Hello</p>
        </TextWrapper>
      )
      unmount()
      act(() => {
        jest.advanceTimersByTime(600)
      })
    })
  })
})
