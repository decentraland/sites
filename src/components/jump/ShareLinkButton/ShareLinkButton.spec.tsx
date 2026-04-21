import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareLinkButton } from './ShareLinkButton'

jest.mock('decentraland-ui2', () => {
  const Button = ({ children, onClick, ...rest }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  )
  const Box = ({ children, ...props }: { children?: React.ReactNode }) => <div {...props}>{children}</div>
  const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
  return {
    Box,
    Button,
    Typography,
    styled: (tag: unknown) => () => tag
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

describe('ShareLinkButton', () => {
  describe('when it is rendered', () => {
    it('should render the share button with the translated label', () => {
      render(<ShareLinkButton url="https://example.com" title="Example" />)
      expect(screen.getByText('component.jump.share.button_text')).toBeInTheDocument()
    })
  })

  describe('when the share button is clicked', () => {
    describe('and navigator.share is available', () => {
      const shareMock = jest.fn().mockResolvedValue(undefined)

      beforeEach(() => {
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: shareMock
        })
      })

      afterEach(() => {
        shareMock.mockReset()
        // @ts-expect-error allow deleting mocked property
        delete navigator.share
      })

      it('should call navigator.share with the provided url and title', async () => {
        render(<ShareLinkButton url="https://example.com" title="Example" />)
        await userEvent.click(screen.getByRole('button'))
        expect(shareMock).toHaveBeenCalledWith({ title: 'Example', url: 'https://example.com' })
      })
    })

    describe('and navigator.share is not available', () => {
      const writeTextMock = jest.fn().mockResolvedValue(undefined)

      beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: writeTextMock }
        })
      })

      afterEach(() => {
        writeTextMock.mockReset()
      })

      it('should fall back to the clipboard', async () => {
        render(<ShareLinkButton url="https://example.com" />)
        await userEvent.click(screen.getByRole('button'))
        expect(writeTextMock).toHaveBeenCalledWith('https://example.com')
      })
    })
  })
})
