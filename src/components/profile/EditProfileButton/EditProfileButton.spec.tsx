import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLaunchExplorer } from '../../../hooks/useLaunchExplorer'
import { EditProfileButton } from './EditProfileButton'

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  DownloadModal: ({ open }: { open: boolean }) => (open ? <div data-testid="download-modal" /> : null),
  styled: (tag: unknown) => () => tag
}))
jest.mock('../../../hooks/useLaunchExplorer', () => ({ useLaunchExplorer: jest.fn() }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockedUseLaunchExplorer = useLaunchExplorer as jest.MockedFunction<typeof useLaunchExplorer>

describe('EditProfileButton', () => {
  let launchExplorer: jest.Mock

  beforeEach(() => {
    launchExplorer = jest.fn()
    mockedUseLaunchExplorer.mockReturnValue({
      launchExplorer,
      isMobile: false,
      isDownloadModalOpen: false,
      closeDownloadModal: jest.fn(),
      downloadModalProps: {
        os: 'apple',
        downloadUrl: 'https://dl.test',
        epicUrl: 'https://epic',
        googlePlayUrl: 'https://google',
        appStoreUrl: 'https://apple'
      }
    } as unknown as ReturnType<typeof useLaunchExplorer>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering the button', () => {
    it('should show the edit label with the pencil icon', () => {
      render(<EditProfileButton />)

      const button = screen.getByRole('button', { name: 'profile.header.edit' })
      expect(button.querySelector('svg')).not.toBeNull()
    })
  })

  describe('when clicking the button', () => {
    it('should launch the explorer like jump in does', async () => {
      render(<EditProfileButton />)

      await userEvent.click(screen.getByRole('button', { name: 'profile.header.edit' }))

      expect(launchExplorer).toHaveBeenCalled()
    })
  })

  describe('when the download fallback modal is open', () => {
    beforeEach(() => {
      mockedUseLaunchExplorer.mockReturnValue({
        launchExplorer,
        isMobile: false,
        isDownloadModalOpen: true,
        closeDownloadModal: jest.fn(),
        downloadModalProps: {
          os: 'apple',
          downloadUrl: 'https://dl.test',
          epicUrl: 'https://epic',
          googlePlayUrl: 'https://google',
          appStoreUrl: 'https://apple'
        }
      } as unknown as ReturnType<typeof useLaunchExplorer>)
    })

    it('should render the download modal', () => {
      render(<EditProfileButton />)

      expect(screen.getByTestId('download-modal')).toBeInTheDocument()
    })
  })
})
