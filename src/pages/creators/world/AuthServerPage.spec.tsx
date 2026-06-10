import { fireEvent, render, screen } from '@testing-library/react'

let mockContext: {
  worldName: string
  deployments: unknown[]
  latest: { authoritativeMultiplayer?: boolean; baseParcel?: string } | null
  place: unknown
}
let mockIdentity: unknown
const mockNavigate = jest.fn()

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({ useWorldContext: () => mockContext }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../hooks/useBlogPageTracking', () => ({ useBlogPageTracking: () => undefined }))
jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: mockIdentity, hasValidIdentity: !!mockIdentity, address: '0xowner' })
}))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }))
jest.mock('../../../components/creators/ServerLogs', () => ({
  ServerLogs: ({ scope }: { scope: unknown }) => <div>{`server-logs:${scope ? 'scope' : 'null'}`}</div>
}))
jest.mock('../../../components/storage/managers', () => ({
  SceneManager: () => <div>scene-manager</div>,
  EnvManager: () => <div>env-manager</div>,
  PlayersManager: (props: { onSelectPlayer: (a: string) => void }) => (
    <button onClick={() => props.onSelectPlayer('0xabc')}>players-manager</button>
  )
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AuthServerPage } = require('./AuthServerPage') as typeof import('./AuthServerPage')

describe('AuthServerPage', () => {
  beforeEach(() => {
    mockContext = {
      worldName: 'test.dcl.eth',
      deployments: [],
      latest: { authoritativeMultiplayer: true, baseParcel: '0,0' },
      place: null
    }
    mockIdentity = { authChain: [] }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the scene is not authoritative', () => {
    beforeEach(() => {
      mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: { authoritativeMultiplayer: false }, place: null }
    })

    it('should show the not-authoritative message and no tabs', () => {
      render(<AuthServerPage />)
      expect(screen.getByText('page.creators.world.storage_not_authoritative')).toBeInTheDocument()
      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    })
  })

  describe('when the scene is authoritative', () => {
    it('should default to the Logs tab and pass a signing scope', () => {
      render(<AuthServerPage />)
      expect(screen.getByText('server-logs:scope')).toBeInTheDocument()
      expect(screen.queryByText('scene-manager')).not.toBeInTheDocument()
    })

    it('should pass a null scope to the logs panel when signed out', () => {
      mockIdentity = undefined
      render(<AuthServerPage />)
      expect(screen.getByText('server-logs:null')).toBeInTheDocument()
    })

    it('should switch to the Storage tab and its scene/env/players managers', () => {
      render(<AuthServerPage />)
      fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.auth_server_storage_title' }))
      expect(screen.getByText('scene-manager')).toBeInTheDocument()
      expect(screen.queryByText('server-logs:scope')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.storage.env' }))
      expect(screen.getByText('env-manager')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.storage.players' }))
      expect(screen.getByText('players-manager')).toBeInTheDocument()
    })

    it('should navigate to the player storage page when a player is selected', () => {
      render(<AuthServerPage />)
      fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.auth_server_storage_title' }))
      fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.storage.players' }))
      fireEvent.click(screen.getByText('players-manager'))
      expect(mockNavigate).toHaveBeenCalledWith('/storage/players/0xabc?realm=test.dcl.eth')
    })

    it('should show the sign-in helper on the Storage tab when signed out', () => {
      mockIdentity = undefined
      render(<AuthServerPage />)
      fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.auth_server_storage_title' }))
      expect(screen.getByText('page.creators.world.storage_sign_in')).toBeInTheDocument()
    })
  })
})
