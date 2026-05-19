import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'

let mockSetSceneResult: { unwrap: () => Promise<{ key: string; value: unknown }> } = {
  unwrap: jest.fn().mockResolvedValue({ key: 'k', value: 'v' })
}
const mockSetSceneValue = jest.fn((_args: unknown) => mockSetSceneResult)

jest.mock('decentraland-ui2', () => dialogMockFactory())
jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))

jest.mock('../../../features/storage/storage.client', () => ({
  __esModule: true,
  useSetSceneValueMutation: () => [mockSetSceneValue, { isLoading: false }],
  useGetSceneValueQuery: () => ({ data: { key: 'k', value: '"existing"' }, isLoading: false })
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, vars?: Record<string, string>) => (vars?.key ? `${key}:${vars.key}` : key)
}))

jest.mock('../StorageValueField', () => {
  const React = jest.requireActual('react')
  return {
    StorageValueField: React.forwardRef((props: { onChange?: (e: { isValid: boolean }) => void; label?: string }, ref: unknown) => {
      const [raw, setRaw] = React.useState('')
      React.useImperativeHandle(ref, () => ({
        reset: () => setRaw(''),
        getParsedValue: () => (raw.trim() ? raw : null)
      }))
      return React.createElement('input', {
        'aria-label': props.label ?? 'storage-value-field',
        value: raw,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setRaw(e.target.value)
          props.onChange?.({ isValid: e.target.value.trim().length > 0 })
        }
      })
    })
  }
})

describe('SceneAddDialog', () => {
  beforeEach(() => {
    mockSetSceneResult = { unwrap: jest.fn().mockResolvedValue({ key: 'k', value: 'v' }) }
    mockSetSceneValue.mockClear()
  })

  it('shows the unauthorized error key and keeps the dialog open when setSceneValue rejects with 403', async () => {
    mockSetSceneResult = { unwrap: jest.fn().mockRejectedValue({ status: 403 }) }
    const { SceneAddDialog } = await import('./SceneDialogs')
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    render(
      <SceneAddDialog
        open
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )

    fireEvent.change(screen.getByLabelText('component.storage.scene_page.add_dialog.key_label'), { target: { value: 'gameState' } })
    fireEvent.change(screen.getByLabelText('component.storage.scene_page.add_dialog.value_label'), { target: { value: '"new"' } })
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.unauthorized')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('SceneEditDialog', () => {
  beforeEach(() => {
    mockSetSceneResult = { unwrap: jest.fn().mockResolvedValue({ key: 'k', value: 'v' }) }
    mockSetSceneValue.mockClear()
  })

  it('shows the server error key when the request returns 500', async () => {
    mockSetSceneResult = { unwrap: jest.fn().mockRejectedValue({ status: 500 }) }
    const { SceneEditDialog } = await import('./SceneDialogs')
    const user = userEvent.setup()
    const onClose = jest.fn()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    render(
      <SceneEditDialog
        open
        keyName="gameState"
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
        identity={undefined}
        realm="vitsky.dcl.eth"
        position="0,0"
      />
    )

    fireEvent.change(screen.getByLabelText('component.storage.scene_page.edit_dialog.value_label'), { target: { value: '"updated"' } })
    await user.click(screen.getByRole('button', { name: 'component.storage.common.save' }))

    expect(await screen.findByText('component.storage.errors.server')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
