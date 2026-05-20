import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory, storageValueFieldMockFactory } from '../__test-utils__/dialogMocks'

let mockSetPlayerResult: { unwrap: () => Promise<{ key: string; value: unknown }> } = {
  unwrap: jest.fn().mockResolvedValue({ key: 'k', value: 'v' })
}
const mockSetPlayerValue = jest.fn((_args: unknown) => mockSetPlayerResult)

jest.mock('decentraland-ui2', () => dialogMockFactory())
jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))

jest.mock('../../../features/storage/storage.client', () => ({
  __esModule: true,
  useSetPlayerValueMutation: () => [mockSetPlayerValue, { isLoading: false }],
  useGetPlayerValueQuery: () => ({ data: { key: 'k', value: '"existing"' }, isLoading: false })
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, vars?: Record<string, string>) => (vars?.key ? `${key}:${vars.key}` : key)
}))

jest.mock('../StorageValueField', () => storageValueFieldMockFactory())

describe('PlayerAddDialog', () => {
  beforeEach(() => {
    mockSetPlayerResult = { unwrap: jest.fn().mockResolvedValue({ key: 'k', value: 'v' }) }
    mockSetPlayerValue.mockClear()
  })

  it('shows the not_found error key when the request returns 404', async () => {
    mockSetPlayerResult = { unwrap: jest.fn().mockRejectedValue({ status: 404 }) }
    const { PlayerAddDialog } = await import('./PlayerDialogs')
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    render(
      <PlayerAddDialog
        open
        address="0xplayer"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )

    fireEvent.change(screen.getByLabelText('component.storage.player_page.add_dialog.key_label'), { target: { value: 'progress' } })
    fireEvent.change(screen.getByLabelText('component.storage.player_page.add_dialog.value_label'), { target: { value: '"new"' } })
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.not_found')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes and emits success when setPlayerValue resolves', async () => {
    const { PlayerAddDialog } = await import('./PlayerDialogs')
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    render(
      <PlayerAddDialog
        open
        address="0xplayer"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )

    fireEvent.change(screen.getByLabelText('component.storage.player_page.add_dialog.key_label'), { target: { value: 'progress' } })
    fireEvent.change(screen.getByLabelText('component.storage.player_page.add_dialog.value_label'), { target: { value: '"new"' } })
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('PlayerEditDialog', () => {
  beforeEach(() => {
    mockSetPlayerResult = { unwrap: jest.fn().mockResolvedValue({ key: 'k', value: 'v' }) }
    mockSetPlayerValue.mockClear()
  })

  it('shows the rate_limited error key when the request returns 429', async () => {
    mockSetPlayerResult = { unwrap: jest.fn().mockRejectedValue({ status: 429 }) }
    const { PlayerEditDialog } = await import('./PlayerDialogs')
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    render(
      <PlayerEditDialog
        open
        address="0xplayer"
        keyName="progress"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )

    fireEvent.change(screen.getByLabelText('component.storage.player_page.edit_dialog.value_label'), { target: { value: '"updated"' } })
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.rate_limited')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('closes and emits success when the mutation resolves', async () => {
    const { PlayerEditDialog } = await import('./PlayerDialogs')
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    render(
      <PlayerEditDialog
        open
        address="0xplayer"
        keyName="progress"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )

    fireEvent.change(screen.getByLabelText('component.storage.player_page.edit_dialog.value_label'), { target: { value: '"updated"' } })
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
