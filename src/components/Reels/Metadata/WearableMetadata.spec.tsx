import { fireEvent, render, screen } from '@testing-library/react'
import { WearableMetadata } from './WearableMetadata'

const trackMock = jest.fn()

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock, isInitialized: true })
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  Button: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <button {...(props as object)}>{children}</button>
  ),
  styled: (tag: string) => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const Component = (tag || 'div') as keyof JSX.IntrinsicElements
    return <Component {...(props as object)}>{props.children}</Component>
  }
}))

jest.mock('../../../features/media/reels', () => ({
  buildMarketplaceWearableUrl: (cid: string, bid: string) => `https://market/${cid}/${bid}`
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const wearable = {
  id: 'w1',
  urn: 'urn:decentraland:matic:collections-v2:0xabc:1',
  name: 'Cool Hat',
  image: 'https://image/wearable.png',
  rarity: 'epic' as const,
  collectionId: '0xabc',
  blockchainId: '1'
}

describe('WearableMetadata', () => {
  beforeEach(() => trackMock.mockReset())

  it('should render the wearable name and image', () => {
    render(<WearableMetadata wearable={wearable} />)
    expect(screen.getByText('Cool Hat')).toBeInTheDocument()
    expect(screen.getByAltText('Cool Hat')).toHaveAttribute('src', 'https://image/wearable.png')
  })

  it('should link to the marketplace item', () => {
    render(<WearableMetadata wearable={wearable} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://market/0xabc/1')
  })

  it('should track REELS_CLICK_WEARABLE on click', () => {
    render(<WearableMetadata wearable={wearable} />)
    fireEvent.click(screen.getByRole('link'))
    expect(trackMock).toHaveBeenCalledWith('Reels Click Wearable', { wearableUrn: wearable.urn })
  })

  it('should render a non-interactive container when collection or blockchain id is missing', () => {
    const partial = { ...wearable, collectionId: undefined }
    render(<WearableMetadata wearable={partial} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Cool Hat')).toBeInTheDocument()
  })
})
