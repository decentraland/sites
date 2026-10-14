import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScenePage } from './ScenePage'

type ChildrenProps = { children?: ReactNode }
type KeyTableMockProps = { keys: { key: string }[]; onDownload?: (key: string) => void }

const mockGetSceneValue = jest.fn()
const mockTrack = jest.fn()
const mockTriggerBlobDownload = jest.fn()

jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))
jest.mock('@mui/icons-material/Add', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/DeleteSweep', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('react-helmet-async', () => ({ Helmet: () => null }))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children }: ChildrenProps) => <div>{children}</div>,
  Button: ({ children }: ChildrenProps) => <button type="button">{children}</button>,
  CircularProgress: () => <div role="progressbar" />
}))

jest.mock('../../features/storage', () => ({
  getStorageErrorStatus: (error: { status?: number }) => error?.status,
  toStorageValueFile: jest.requireActual('../../features/storage/storage.helpers').toStorageValueFile,
  useClearSceneMutation: () => [jest.fn()],
  useDeleteSceneValueMutation: () => [jest.fn()],
  useLazyGetSceneValueQuery: () => [mockGetSceneValue],
  useListSceneKeysQuery: () => ({ currentData: [{ key: 'feedback-1.csv' }], isLoading: false })
}))

jest.mock('../../components/storage/KeyTable', () => ({
  KeyTable: ({ keys, onDownload }: KeyTableMockProps) => (
    <div>
      {keys.map(({ key }) => (
        <button key={key} type="button" aria-label={`download ${key}`} onClick={() => onDownload?.(key)} />
      ))}
    </div>
  )
}))
jest.mock('../../components/storage/ConfirmDialog', () => ({ ConfirmDialog: () => null }))
jest.mock('../../components/storage/SceneDialogs', () => ({ SceneAddDialog: () => null, SceneEditDialog: () => null }))
jest.mock('./shared.styled', () => ({ SectionHeader: ({ children }: ChildrenProps) => <div>{children}</div> }))
jest.mock('../../components/storage/StorageLayout', () => ({
  StorageLayout: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => ({ identity: undefined, address: '0xabc' }) }))
jest.mock('../../hooks/usePageViewTracking', () => ({ usePageViewTracking: jest.fn() }))
jest.mock('../../hooks/useStorageRedirect', () => ({ useStorageRedirect: jest.fn() }))
jest.mock('../../hooks/useStorageScope', () => ({
  useStorageScope: () => ({ realm: 'flutterecho.dcl.eth', position: '0,-1', blocked: false })
}))
jest.mock('../../hooks/useStorageTrack', () => ({ useStorageTrack: () => mockTrack }))
jest.mock('../../modules/file', () => ({
  triggerBlobDownload: (blob: Blob, filename: string) => mockTriggerBlobDownload(blob, filename)
}))

describe('ScenePage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a key is downloaded and the value loads', () => {
    beforeEach(() => {
      mockGetSceneValue.mockReturnValue({ unwrap: () => Promise.resolve({ key: 'feedback-1.csv', value: 'id,rating\n1,5' }) })
    })

    it('should save the value as a file named after the key', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)

      await user.click(screen.getByRole('button', { name: 'download feedback-1.csv' }))

      await waitFor(() => expect(mockTriggerBlobDownload).toHaveBeenCalledTimes(1))
      const [blob, filename] = mockTriggerBlobDownload.mock.calls[0] as [Blob, string]
      expect(filename).toBe('feedback-1.csv')
      expect(blob.type).toBe('text/csv')
      expect(blob.size).toBe('id,rating\n1,5'.length)
      expect(mockGetSceneValue).toHaveBeenCalledWith({
        identity: undefined,
        realm: 'flutterecho.dcl.eth',
        position: '0,-1',
        key: 'feedback-1.csv'
      })
      expect(mockTrack).toHaveBeenCalledWith('Storage Scene Download Success')
    })
  })

  describe('when a key is downloaded and the value fails to load', () => {
    beforeEach(() => {
      mockGetSceneValue.mockReturnValue({ unwrap: () => Promise.reject({ status: 403 }) })
    })

    it('should not save a file and should track the failure', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)

      await user.click(screen.getByRole('button', { name: 'download feedback-1.csv' }))

      await waitFor(() => expect(mockTrack).toHaveBeenCalledWith('Storage Scene Download Failure', { errorStatus: 403 }))
      expect(mockTriggerBlobDownload).not.toHaveBeenCalled()
    })
  })
})
