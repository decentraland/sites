import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'
import { ConfirmDialog } from './ConfirmDialog'

jest.mock('decentraland-ui2', () => dialogMockFactory())

describe('ConfirmDialog', () => {
  let onConfirm: jest.Mock
  let onCancel: jest.Mock

  beforeEach(() => {
    onConfirm = jest.fn()
    onCancel = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const renderDialog = (pending = false) =>
    render(
      <ConfirmDialog
        open
        title="Delete?"
        message="Are you sure"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
        pending={pending}
      />
    )

  describe('when it is not pending', () => {
    beforeEach(() => renderDialog(false))

    it('should run onConfirm when the confirm button is clicked', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })
  })

  describe('when it is pending', () => {
    beforeEach(() => renderDialog(true))

    it('should disable the confirm button so it cannot be submitted twice', () => {
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    })

    it('should disable the cancel button', () => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })
  })
})
