import { fireEvent, render, screen } from '@testing-library/react'
import type { ServerLogsScope } from '../../../features/authServer'
import type { UseServerLogsResult } from '../../../hooks/useServerLogs'

let mockLogs: UseServerLogsResult

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../hooks/useServerLogs', () => ({ useServerLogs: () => mockLogs }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked hooks win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ServerLogs } = require('./ServerLogs') as typeof import('./ServerLogs')

const scope = { identity: {}, sceneId: 's', realmName: 'r', parcel: '0,0' } as unknown as ServerLogsScope

function setLogs(partial: Partial<UseServerLogsResult>) {
  mockLogs = { status: 'idle', lines: [], clear: jest.fn(), reconnect: jest.fn(), ...partial }
}

describe('ServerLogs', () => {
  beforeEach(() => {
    setLogs({})
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should ask the viewer to sign in when there is no scope', () => {
    render(<ServerLogs scope={null} />)
    expect(screen.getByText('page.creators.world.auth_server_logs_sign_in')).toBeInTheDocument()
  })

  it('should show the connect CTA before streaming and start on click', () => {
    render(<ServerLogs scope={scope} />)
    const connect = screen.getByText('page.creators.world.auth_server_logs_connect')
    expect(connect).toBeInTheDocument()
    // Toolbar (stop button) only appears after connecting.
    expect(screen.queryByText('page.creators.world.auth_server_logs_stop')).not.toBeInTheDocument()
    fireEvent.click(connect)
    expect(screen.getByText('page.creators.world.auth_server_logs_stop')).toBeInTheDocument()
  })

  it('should render streamed log lines with their level', () => {
    setLogs({ status: 'streaming', lines: [{ id: 0, timestamp: 0, level: 'error', message: 'boom', extra: '{"a":1}' }] })
    render(<ServerLogs scope={scope} />)
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_connect'))
    expect(screen.getByText('boom')).toBeInTheDocument()
    expect(screen.getByText('error')).toBeInTheDocument()
    expect(screen.getByText('page.creators.world.auth_server_logs_live')).toBeInTheDocument()
  })

  it('should show a connecting state', () => {
    setLogs({ status: 'connecting', lines: [] })
    render(<ServerLogs scope={scope} />)
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_connect'))
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should show the error state with a reconnect action', () => {
    const reconnect = jest.fn()
    setLogs({ status: 'error', lines: [], reconnect })
    render(<ServerLogs scope={scope} />)
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_connect'))
    expect(screen.getByText('page.creators.world.auth_server_logs_error')).toBeInTheDocument()
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_reconnect'))
    expect(reconnect).toHaveBeenCalled()
  })

  it('should clear lines and stop streaming', () => {
    const clear = jest.fn()
    setLogs({ status: 'streaming', lines: [{ id: 0, timestamp: 0, level: 'info', message: 'x' }], clear })
    render(<ServerLogs scope={scope} />)
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_connect'))
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_clear'))
    expect(clear).toHaveBeenCalled()
    // Stop returns to the connect CTA.
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_stop'))
    expect(screen.getByText('page.creators.world.auth_server_logs_connect')).toBeInTheDocument()
  })

  it('should show an empty state while connected with no lines yet', () => {
    setLogs({ status: 'streaming', lines: [] })
    render(<ServerLogs scope={scope} />)
    fireEvent.click(screen.getByText('page.creators.world.auth_server_logs_connect'))
    expect(screen.getByText('page.creators.world.auth_server_logs_empty')).toBeInTheDocument()
  })
})
