import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { SegmentEvent } from '../../../modules/segment.types'

const mockListPlayersQuery = jest.fn()
const mockClearAllPlayers = jest.fn()
const mockTrack = jest.fn()
const mockGetProfileNames = jest.fn()

jest.mock('../../../features/storage', () => ({
  useListPlayersQuery: (...args: unknown[]) => mockListPlayersQuery(...args),
  useClearAllPlayersMutation: () => [mockClearAllPlayers]
}))
jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileNames: (...args: unknown[]) => mockGetProfileNames(...args)
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string, values?: Record<string, unknown>) => (values ? `${id}:${JSON.stringify(values)}` : id)
}))
jest.mock('../../../hooks/useStorageTrack', () => ({ useStorageTrack: () => mockTrack }))
jest.mock('../ConfirmDialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel, title }: { open: boolean; onConfirm: () => void; onCancel: () => void; title: string }) =>
    open ? (
      <div>
        <button onClick={onConfirm}>{`confirm:${title}`}</button>
        <button onClick={onCancel}>{`cancel:${title}`}</button>
      </div>
    ) : null
}))
jest.mock('../PlayerCard', () => ({
  PlayerCard: ({ address, displayName, onClick }: { address: string; displayName?: string; onClick: () => void }) => (
    <button onClick={onClick}>{`player:${address}:${displayName ?? 'none'}`}</button>
  )
}))
jest.mock('../SearchField', () => ({
  SearchField: ({
    value,
    onChange,
    onClear
  }: {
    value: string
    onChange: (e: { target: { value: string } }) => void
    onClear: () => void
  }) => (
    <div>
      <input aria-label="search" value={value} onChange={onChange} />
      <button onClick={onClear}>clear-search</button>
    </div>
  )
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PlayersManager } = require('./PlayersManager') as typeof import('./PlayersManager')

const identity = {} as AuthIdentity
const onSelectPlayer = jest.fn()
const baseProps = { identity, realm: 'w.dcl.eth', position: '0,0', onSelectPlayer }

describe('PlayersManager', () => {
  beforeEach(() => {
    mockListPlayersQuery.mockReturnValue({ data: ['0xAAA', '0xBBB'], isLoading: false })
    mockClearAllPlayers.mockReturnValue({ unwrap: () => Promise.resolve() })
    mockGetProfileNames.mockReturnValue(new Map([['0xaaa', 'alice']]))
  })
  afterEach(() => jest.resetAllMocks())

  describe('when players are loading', () => {
    it('should render the loading spinner', () => {
      mockListPlayersQuery.mockReturnValue({ data: undefined, isLoading: true })
      render(<PlayersManager {...baseProps} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when players are present', () => {
    it('should render a card per player with the resolved display name', () => {
      render(<PlayersManager {...baseProps} />)
      expect(screen.getByText('player:0xAAA:alice')).toBeInTheDocument()
      expect(screen.getByText('player:0xBBB:none')).toBeInTheDocument()
    })

    it('should invoke onSelectPlayer when a card is clicked', () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.click(screen.getByText('player:0xAAA:alice'))
      expect(onSelectPlayer).toHaveBeenCalledWith('0xAAA')
    })
  })

  describe('when there are no players', () => {
    it('should show the empty message and hide search + clear', () => {
      mockListPlayersQuery.mockReturnValue({ data: [], isLoading: false })
      mockGetProfileNames.mockReturnValue(new Map())
      render(<PlayersManager {...baseProps} />)
      expect(screen.getByText('component.storage.player_page.no_players')).toBeInTheDocument()
      expect(screen.queryByLabelText('search')).not.toBeInTheDocument()
      expect(screen.queryByText('component.storage.player_page.clear_all_players')).not.toBeInTheDocument()
    })
  })

  describe('when filtering by query', () => {
    it('should match by display name', () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.change(screen.getByLabelText('search'), { target: { value: 'ali' } })
      expect(screen.getByText('player:0xAAA:alice')).toBeInTheDocument()
      expect(screen.queryByText('player:0xBBB:none')).not.toBeInTheDocument()
    })

    it('should match by address', () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.change(screen.getByLabelText('search'), { target: { value: '0xbbb' } })
      expect(screen.getByText('player:0xBBB:none')).toBeInTheDocument()
      expect(screen.queryByText('player:0xAAA:alice')).not.toBeInTheDocument()
    })

    it('should show the no-search-results message when nothing matches', () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.change(screen.getByLabelText('search'), { target: { value: 'zzz' } })
      expect(screen.getByText(/component.storage.player_page.no_search_results/)).toBeInTheDocument()
    })

    it('should reset the query when cleared', () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.change(screen.getByLabelText('search'), { target: { value: 'zzz' } })
      fireEvent.click(screen.getByText('clear-search'))
      expect(screen.getByText('player:0xAAA:alice')).toBeInTheDocument()
    })
  })

  describe('when clearing all players', () => {
    it('should call the clear mutation and track success', async () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.click(screen.getByText('component.storage.player_page.clear_all_players'))
      fireEvent.click(screen.getByText('confirm:component.storage.player_page.clear_all_dialog.title'))
      await waitFor(() => expect(mockClearAllPlayers).toHaveBeenCalledWith({ identity, realm: 'w.dcl.eth', position: '0,0' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_SUCCESS)
    })

    it('should track failure when the clear mutation rejects', async () => {
      mockClearAllPlayers.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) })
      render(<PlayersManager {...baseProps} />)
      fireEvent.click(screen.getByText('component.storage.player_page.clear_all_players'))
      fireEvent.click(screen.getByText('confirm:component.storage.player_page.clear_all_dialog.title'))
      await waitFor(() => expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_FAILURE))
    })

    it('should close the dialog on cancel without mutating', () => {
      render(<PlayersManager {...baseProps} />)
      fireEvent.click(screen.getByText('component.storage.player_page.clear_all_players'))
      fireEvent.click(screen.getByText('cancel:component.storage.player_page.clear_all_dialog.title'))
      expect(screen.queryByText('confirm:component.storage.player_page.clear_all_dialog.title')).not.toBeInTheDocument()
      expect(mockClearAllPlayers).not.toHaveBeenCalled()
    })
  })

  describe('when there is no identity', () => {
    it('should skip the list query', () => {
      render(<PlayersManager identity={undefined} realm={null} position={null} onSelectPlayer={onSelectPlayer} />)
      expect(mockListPlayersQuery.mock.calls[0][1]).toEqual({ skip: true })
    })
  })
})
