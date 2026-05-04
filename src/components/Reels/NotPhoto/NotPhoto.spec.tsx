import { render, screen } from '@testing-library/react'
import { NotPhoto } from './NotPhoto'

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  Typography: ({ children, ...props }: { children?: React.ReactNode }) => <p {...props}>{children}</p>,
  styled: () => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const { children, ...rest } = props
    return <div {...(rest as object)}>{children}</div>
  }
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

describe('NotPhoto', () => {
  it('should render the empty state title', () => {
    render(<NotPhoto />)
    expect(screen.getByText('component.reels.no_photo.title')).toBeInTheDocument()
  })

  it('should render the empty state subtitle', () => {
    render(<NotPhoto />)
    expect(screen.getByText('component.reels.no_photo.subtitle')).toBeInTheDocument()
  })
})
