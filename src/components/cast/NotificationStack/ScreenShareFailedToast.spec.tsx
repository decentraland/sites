// NotificationStack.styled.ts pulls in decentraland-ui2 (ESM that ts-jest does
// not transform) via `styled(Button)`. Replace the styled factories with plain
// DOM tags so the test exercises only the toast's render logic, mirroring the
// LiveNowCard.spec.tsx convention. ActionButton stays a real <button> so the
// action renders with the button role.
jest.mock('./NotificationStack.styled', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const create =
    (tag: string) =>
    ({ children, ...rest }: { children?: unknown } & Record<string, unknown>) =>
      ReactLib.createElement(tag, rest, children as never)
  return {
    StackRoot: create('div'),
    Toast: create('div'),
    TopRow: create('div'),
    TextBlock: create('div'),
    Title: create('div'),
    Message: create('div'),
    CloseButton: create('button'),
    ActionButton: create('button')
  }
})

import { fireEvent, render, screen } from '@testing-library/react'
import { Notification } from '../../../features/cast2/contexts/NotificationContext'
import { ScreenShareFailedToast } from './ScreenShareFailedToast'

jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

const baseNotification: Notification = { id: 'n1', variant: 'ScreenShareFailed' }

describe('ScreenShareFailedToast', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the notification has no action', () => {
    it('should render the title and default message without an action button', () => {
      render(<ScreenShareFailedToast notification={baseNotification} onDismiss={jest.fn()} />)

      expect(screen.getByText('notifications.screen_share_failed.title')).toBeInTheDocument()
      expect(screen.getByText('notifications.screen_share_failed.default_message')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    })
  })

  describe('when the notification has an action', () => {
    it('should render the action button and fire its onClick', () => {
      const onClick = jest.fn()
      const onDismiss = jest.fn()
      const notification: Notification = {
        ...baseNotification,
        message: 'notifications.screen_share_failed.stopped_message',
        action: { label: 'Retry', onClick }
      }

      render(<ScreenShareFailedToast notification={notification} onDismiss={onDismiss} />)

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onDismiss).toHaveBeenCalledWith('n1') // Toast.Action auto-dismisses
    })
  })
})
