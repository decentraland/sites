import { render, screen } from '@testing-library/react'
import { ImageViewer } from './ImageViewer'

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...(props as object)}>{children}</div>,
  CircularProgress: () => <div data-testid="reels-loader" />,
  useMediaQuery: () => false,
  styled: () => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const { children, ...rest } = props
    return <div {...(rest as object)}>{children}</div>
  }
}))

jest.mock('../Logo', () => ({ Logo: () => <div data-testid="reels-logo" /> }))
jest.mock('../ImageActions', () => ({ ImageActions: () => <div data-testid="reels-image-actions" /> }))

const fakeImage = {
  id: 'img-1',
  url: 'https://image.url/foo.jpg',
  thumbnailUrl: '',
  metadata: {
    userName: 'alice',
    userAddress: '0xa',
    dateTime: '',
    realm: '',
    scene: { name: 'Plaza', location: { x: '0', y: '0' } },
    visiblePeople: []
  }
}

describe('ImageViewer', () => {
  describe('when loading', () => {
    it('should render the loader and not the image', () => {
      render(<ImageViewer image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} loading={true} />)
      expect(screen.getByTestId('reels-loader')).toBeInTheDocument()
      expect(screen.queryByAltText('Plaza')).not.toBeInTheDocument()
    })
  })

  describe('when loaded', () => {
    it('should render the image with scene name as alt', () => {
      render(<ImageViewer image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} loading={false} />)
      expect(screen.getByAltText('Plaza')).toHaveAttribute('src', 'https://image.url/foo.jpg')
      expect(screen.queryByTestId('reels-loader')).not.toBeInTheDocument()
    })
  })

  describe('always', () => {
    it('should render Logo and ImageActions', () => {
      render(<ImageViewer image={fakeImage} metadataVisible={false} onToggleMetadata={jest.fn()} loading={false} />)
      expect(screen.getByTestId('reels-logo')).toBeInTheDocument()
      expect(screen.getByTestId('reels-image-actions')).toBeInTheDocument()
    })
  })
})
