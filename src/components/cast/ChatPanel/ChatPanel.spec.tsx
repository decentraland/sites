import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { useLiveKitCredentials } from '../../../features/cast2/contexts/LiveKitContext'
import { ChatPanel } from './ChatPanel'

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <p {...(props as object)}>{children}</p>
  ),
  styled: (tag: unknown) => () => (props: { children?: React.ReactNode; href?: string } & Record<string, unknown>) => {
    const Tag = (typeof tag === 'string' ? tag : 'div') as keyof JSX.IntrinsicElements
    return (
      <Tag {...(props as object)} {...(props.href !== undefined ? { href: props.href } : {})}>
        {props.children}
      </Tag>
    )
  }
}))

jest.mock('@mui/icons-material/Close', () => () => <span data-testid="close-icon" />)

jest.mock('../../../features/cast2/contexts/ChatProvider', () => ({
  useChatContext: jest.fn()
}))

jest.mock('../../../features/cast2/contexts/LiveKitContext', () => ({
  useLiveKitCredentials: jest.fn()
}))

jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../Avatar/Avatar', () => ({ Avatar: () => <span data-testid="avatar" /> }))

const mockUseLiveKitCredentials = jest.mocked(useLiveKitCredentials)
const mockUseChatContext = jest.mocked(useChatContext)

function renderPanel(initialEntries: string[] = ['/cast/s/whatever']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ChatPanel onClose={jest.fn()} chatMessages={[]} onMessagesRead={jest.fn()} />
    </MemoryRouter>
  )
}

describe('ChatPanel', () => {
  beforeEach(() => {
    mockUseChatContext.mockReturnValue({ profiles: new Map() } as never)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when streamMetadata is missing', () => {
    beforeEach(() => {
      mockUseLiveKitCredentials.mockReturnValue({ streamMetadata: null } as never)
    })

    it('should not render a jump link', () => {
      renderPanel()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('when streamMetadata describes a world', () => {
    beforeEach(() => {
      mockUseLiveKitCredentials.mockReturnValue({
        streamMetadata: { isWorld: true, location: 'foo.dcl.eth', placeName: 'Foo' }
      } as never)
    })

    it('should build a jump link with realm and no position', () => {
      renderPanel()
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org/jump/?realm=foo.dcl.eth')
    })

    it('should append dclenv when ?dclenv is in the URL', () => {
      renderPanel(['/cast/s/whatever?dclenv=zone'])
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org/jump/?realm=foo.dcl.eth&dclenv=zone')
    })
  })

  describe('when streamMetadata describes a Genesis City scene', () => {
    beforeEach(() => {
      mockUseLiveKitCredentials.mockReturnValue({
        streamMetadata: { isWorld: false, location: '10,20', placeName: 'Plaza' }
      } as never)
    })

    it('should build a jump link with position', () => {
      renderPanel()
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org/jump/?position=10%2C20')
    })

    it('should append dclenv from ?env=dev mapping', () => {
      renderPanel(['/cast/s/whatever?env=dev'])
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org/jump/?position=10%2C20&dclenv=zone')
    })
  })

  describe('when hosted on decentraland.zone with no query', () => {
    const originalLocation = window.location

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, hostname: 'decentraland.zone' }
      })
      mockUseLiveKitCredentials.mockReturnValue({
        streamMetadata: { isWorld: true, location: 'foo.dcl.eth', placeName: 'Foo' }
      } as never)
    })

    afterEach(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    })

    it('should default the dclenv to zone', () => {
      renderPanel()
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://decentraland.org/jump/?realm=foo.dcl.eth&dclenv=zone')
    })
  })
})
