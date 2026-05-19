import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'

let mockSetEnvResult: { unwrap: () => Promise<void> } = { unwrap: jest.fn().mockResolvedValue(undefined) }
const mockSetEnv = jest.fn((_args: unknown) => mockSetEnvResult)

jest.mock('decentraland-ui2', () => dialogMockFactory())
jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))

jest.mock('../../../features/storage/storage.client', () => ({
  __esModule: true,
  useSetEnvMutation: () => [mockSetEnv, { isLoading: false }]
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const renderComponent = async () => {
  const { EnvAddDialog } = await import('./EnvDialogs')
  const onClose = jest.fn()
  const onSuccess = jest.fn()
  const onError = jest.fn()
  const utils = render(
    <EnvAddDialog
      open
      onClose={onClose}
      onSuccess={onSuccess}
      onError={onError}
      identity={undefined}
      realm="vitsky.dcl.eth"
      position="0,0"
    />
  )
  return { ...utils, onClose, onSuccess, onError }
}

describe('EnvAddDialog', () => {
  beforeEach(() => {
    mockSetEnvResult = { unwrap: jest.fn().mockResolvedValue(undefined) }
    mockSetEnv.mockClear()
  })

  it('shows the unauthorized error key and keeps the dialog open when setEnv rejects with 401', async () => {
    mockSetEnvResult = { unwrap: jest.fn().mockRejectedValue({ status: 401, data: 'Unauthorized' }) }
    const user = userEvent.setup()
    const { onClose, onSuccess, onError } = await renderComponent()

    await user.type(screen.getByLabelText('component.storage.env_page.add_dialog.key_label'), 'API_KEY')
    await user.type(screen.getByLabelText('component.storage.env_page.add_dialog.value_label'), 'secret')
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.unauthorized')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the network error key when the request fails to reach the server', async () => {
    mockSetEnvResult = { unwrap: jest.fn().mockRejectedValue({ status: 'FETCH_ERROR', error: 'offline' }) }
    const user = userEvent.setup()
    await renderComponent()

    await user.type(screen.getByLabelText('component.storage.env_page.add_dialog.key_label'), 'API_KEY')
    await user.type(screen.getByLabelText('component.storage.env_page.add_dialog.value_label'), 'secret')
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.network')).toBeInTheDocument()
  })

  it('closes the dialog and emits success when setEnv resolves', async () => {
    const user = userEvent.setup()
    const { onClose, onSuccess, onError } = await renderComponent()

    await user.type(screen.getByLabelText('component.storage.env_page.add_dialog.key_label'), 'API_KEY')
    await user.type(screen.getByLabelText('component.storage.env_page.add_dialog.value_label'), 'secret')
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
    expect(screen.queryByText('component.storage.errors.unauthorized')).not.toBeInTheDocument()
  })
})

describe('EnvEditDialog', () => {
  beforeEach(() => {
    mockSetEnvResult = { unwrap: jest.fn().mockResolvedValue(undefined) }
    mockSetEnv.mockClear()
  })

  const renderEdit = async () => {
    const { EnvEditDialog } = await import('./EnvDialogs')
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()
    const utils = render(
      <EnvEditDialog
        open
        keyName="API_KEY"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )
    return { ...utils, onClose, onSuccess, onError }
  }

  it('shows the unauthorized error key on a 401 rejection', async () => {
    mockSetEnvResult = { unwrap: jest.fn().mockRejectedValue({ status: 401, data: 'Unauthorized' }) }
    const user = userEvent.setup()
    const { onClose, onError } = await renderEdit()

    await user.type(screen.getByLabelText('component.storage.env_page.edit_dialog.value_label'), 'updated-secret')
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.unauthorized')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes and emits success on a resolved mutation', async () => {
    const user = userEvent.setup()
    const { onClose, onSuccess } = await renderEdit()

    await user.type(screen.getByLabelText('component.storage.env_page.edit_dialog.value_label'), 'updated-secret')
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
