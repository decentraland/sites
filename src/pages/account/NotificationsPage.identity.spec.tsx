import { StrictMode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { accountNotificationsClient } from '../../services/accountNotificationsClient'
import { NotificationsPage } from './NotificationsPage'

jest.mock('decentraland-ui2', () => jest.requireActual('@mui/material'))

const mockSignedFetch = jest.fn()
const mockAuth = jest.fn()
jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory:
    () =>
    (...args: unknown[]) =>
      mockSignedFetch(...args)
}))
jest.mock('../../config/env', () => ({ getEnv: () => 'https://notifications.test' }))
jest.mock('../../utils/activeIdentity', () => ({ resolveActiveIdentity: () => mockAuth().identity }))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => mockAuth() }))
jest.mock('../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))

const buildStore = () =>
  configureStore({
    reducer: { [accountNotificationsClient.reducerPath]: accountNotificationsClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(accountNotificationsClient.middleware)
  })
const response = (email: string) =>
  new Response(JSON.stringify({ email, details: { ignore_all_email: false, ignore_all_in_app: false, message_type: {} } }), {
    headers: { 'Content-Type': 'application/json' }
  })
const signedIn = (address: string) => ({ address, hasValidIdentity: true, identity: { authChain: [{ payload: address }] } })

describe('when notifications stay mounted during a wallet switch', () => {
  let store: ReturnType<typeof buildStore>
  let view: ReturnType<typeof render>
  let user: ReturnType<typeof userEvent.setup>
  let finish: (response: Response) => void
  let tree: React.ReactElement

  beforeEach(async () => {
    store = buildStore()
    user = userEvent.setup()
    mockAuth.mockReturnValue(signedIn('0xaaa'))
    mockSignedFetch.mockResolvedValueOnce(response('alice@example.com'))
    tree = (
      <StrictMode>
        <Provider store={store}>
          <HelmetProvider>
            <NotificationsPage />
          </HelmetProvider>
        </Provider>
      </StrictMode>
    )
    view = render(tree)
    await screen.findByDisplayValue('alice@example.com')
  })

  afterEach(() => {
    view.unmount()
    store.dispatch(accountNotificationsClient.util.resetApiState())
    jest.resetAllMocks()
  })

  it('should clear the old email draft immediately and wait for the new account response', async () => {
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'unsaved@example.com')
    mockSignedFetch.mockReturnValueOnce(
      new Promise<Response>(resolve => {
        finish = resolve
      })
    )
    mockAuth.mockReturnValue(signedIn('0xbbb'))
    view.rerender(
      <StrictMode>
        <Provider store={store}>
          <HelmetProvider>
            <NotificationsPage />
          </HelmetProvider>
        </Provider>
      </StrictMode>
    )
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.queryByDisplayValue('unsaved@example.com')).not.toBeInTheDocument()
    await act(async () => {
      finish(response('bob@example.com'))
    })
    expect(await screen.findByDisplayValue('bob@example.com')).toBeInTheDocument()
  })

  it('should remove the private form on logout without another signed request', () => {
    mockAuth.mockReturnValue({ address: undefined, hasValidIdentity: false, identity: undefined })
    view.rerender(
      <StrictMode>
        <Provider store={store}>
          <HelmetProvider>
            <NotificationsPage />
          </HelmetProvider>
        </Provider>
      </StrictMode>
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(mockSignedFetch).toHaveBeenCalledTimes(1)
  })
})
