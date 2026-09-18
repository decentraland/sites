import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownItem, DropdownList, SelectorButton, SelectorLabel } from '../../StreamerOnboarding/StreamerOnboarding.styled'
import { DeviceSelector } from './DeviceSelector'
import type { DeviceOption } from './DeviceSelector.types'

// UI2 reexports these MUI controls as ESM. Exercise the real controls under Jest's CJS runtime.
jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('@mui/material'),
  useDesktopMediaQuery: () => true,
  dclColors: jest.requireActual('../../../../__test-utils__/styledMock').dclColors
}))

describe('when choosing a Cast device with the keyboard', () => {
  let user: ReturnType<typeof userEvent.setup>
  let onDeviceSelect: jest.Mock
  let devices: DeviceOption[]

  beforeEach(() => {
    user = userEvent.setup()
    onDeviceSelect = jest.fn()
    devices = [
      { deviceId: 'first', label: 'Built-in microphone', kind: 'audioinput' },
      { deviceId: 'second', label: 'USB microphone', kind: 'audioinput' }
    ]
    render(
      <DeviceSelector
        label="Microphone"
        devices={devices}
        selectedDeviceId="first"
        onDeviceSelect={onDeviceSelect}
        childComponents={{ SelectorButton, SelectorLabel, DropdownList, DropdownItem }}
      />
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should open with Enter, navigate options, select with Enter, and restore trigger focus', async () => {
    await user.tab()
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Microphone', hidden: true })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: 'Microphone' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Built-in microphone' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Built-in microphone' })).toHaveFocus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onDeviceSelect).toHaveBeenCalledWith('second')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveFocus()
  })

  it('should open with Space and close with Escape without changing the selection', async () => {
    await user.tab()
    await user.keyboard(' ')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(onDeviceSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Microphone' })).toHaveFocus()
  })

  it('should support opening with ArrowDown and selecting with Space', async () => {
    await user.tab()
    await user.keyboard('{ArrowDown}{End} ')
    expect(onDeviceSelect).toHaveBeenCalledWith('second')
  })
})
