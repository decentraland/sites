import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { CollaboratorScene, CollaboratorScenesResponse, Land, World } from '../../features/storage'
import { LandType, RoleType } from '../../features/storage/storage.types'
import { SelectPage } from './SelectPage'

interface SearchFieldStubProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder?: string
}

const mockNavigate = jest.fn()
const mockUseAuthIdentity = jest.fn()
const mockCollaboratorScenesQuery = jest.fn()
const mockContributableDomainsQuery = jest.fn()
const mockDCLNamesQuery = jest.fn()
const mockLandsQuery = jest.fn()
const mockRentalsQuery = jest.fn()

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: (props: Record<string, unknown>) => React.createElement('span', null, props.children as React.ReactNode),
    Button: (props: Record<string, unknown>) =>
      React.createElement(
        'button',
        { type: 'button', onClick: props.onClick, disabled: props.disabled },
        props.children as React.ReactNode
      ),
    CircularProgress: (props: Record<string, unknown>) =>
      React.createElement('div', { role: 'progressbar', 'aria-label': props['aria-label'] }),
    Tabs: (props: Record<string, unknown>) =>
      React.createElement(
        'div',
        null,
        React.Children.map(props.children as React.ReactNode, (child, index) =>
          React.createElement(
            'button',
            {
              type: 'button',
              role: 'tab',
              onClick: () => (props.onChange as (e: unknown, v: number) => void)?.({}, index)
            },
            (child as React.ReactElement<{ label?: React.ReactNode }>).props.label
          )
        )
      ),
    Tab: () => null
  }
})

jest.mock('react-helmet-async', () => ({
  Helmet: () => null
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

jest.mock('../../features/storage', () => ({
  getLandPosition: () => '0,0',
  useGetCollaboratorScenesQuery: (...args: unknown[]) => mockCollaboratorScenesQuery(...args),
  useGetContributableDomainsQuery: () => mockContributableDomainsQuery(),
  useGetUserDCLNamesQuery: () => mockDCLNamesQuery(),
  useGetUserLandsQuery: () => mockLandsQuery(),
  useGetUserRentalsQuery: () => mockRentalsQuery(),
  useGetWorldScenesQuery: () => ({ data: [], isLoading: false })
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

jest.mock('../../hooks/usePageViewTracking', () => ({
  usePageViewTracking: jest.fn()
}))

jest.mock('../../hooks/useStorageRedirect', () => ({
  useStorageRedirect: () => ({ isReady: true })
}))

jest.mock('../../components/storage/SearchField', () => ({
  SearchField: (props: SearchFieldStubProps) => {
    const { value, onChange, onClear, placeholder } = props
    return (
      <div>
        <input aria-label={placeholder} value={value} onChange={onChange} />
        <button type="button" onClick={onClear}>
          {`clear-${placeholder}`}
        </button>
      </div>
    )
  }
}))

jest.mock('../../components/storage/WorldCard', () => ({
  WorldCard: ({ world, onEditClick }: { world: World; onEditClick: (name: string, position?: string) => void }) => (
    <button type="button" onClick={() => onEditClick(world.name, '10,10')}>
      {world.name}
    </button>
  )
}))

jest.mock('../../components/storage/LandCard', () => ({
  LandCard: ({ land, onClick }: { land: Land; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {land.name}
    </button>
  )
}))

jest.mock('../../components/storage/CollaboratorSceneCard', () => ({
  CollaboratorSceneCard: ({ scene, onEditClick }: { scene: CollaboratorScene; onEditClick: (scene: CollaboratorScene) => void }) => (
    <div data-testid="collaborator-card">
      <button type="button" onClick={() => onEditClick(scene)}>
        {scene.sceneId}
      </button>
    </div>
  )
}))

const PAGE_SIZE = 20
const TOTAL = 45

const createScene = (index: number): CollaboratorScene => ({
  sceneId: `scene-${index}`,
  worldName: 'gabi.dcl.eth',
  baseParcel: `${index},${index}`,
  title: `Scene ${index}`,
  realmKind: 'world'
})

const createPage = (offset: number): CollaboratorScenesResponse => ({
  data: Array.from({ length: PAGE_SIZE }, (_, index) => createScene(offset + index)),
  pagination: { limit: PAGE_SIZE, offset, total: TOTAL }
})

const createLand = (id: string, name: string): Land => ({
  id,
  tokenId: id,
  type: LandType.PARCEL,
  role: RoleType.OWNER,
  name,
  description: null,
  owner: '0x1',
  operators: []
})

const stubIntersectionObserver = (onObserverCreated: (cb: IntersectionObserverCallback) => void) => {
  window.IntersectionObserver = jest.fn((cb: IntersectionObserverCallback) => {
    onObserverCreated(cb)
    return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() } as unknown as IntersectionObserver
  }) as unknown as typeof IntersectionObserver
}

const openTab = (name: RegExp) => {
  fireEvent.click(screen.getByRole('tab', { name }))
}

const openCollaborationsTab = () => openTab(/collaborations/)

const nativeIntersectionObserver = window.IntersectionObserver

describe('SelectPage', () => {
  let intersectionCallback: IntersectionObserverCallback | undefined
  let collaboratorScenes: { currentData?: CollaboratorScenesResponse; isLoading: boolean; isFetching: boolean; isError: boolean }
  let lands: Land[]

  beforeEach(() => {
    collaboratorScenes = { currentData: createPage(0), isLoading: false, isFetching: false, isError: false }
    mockUseAuthIdentity.mockReturnValue({
      identity: { authChain: [] },
      hasValidIdentity: true,
      address: '0x1'
    })
    mockCollaboratorScenesQuery.mockImplementation(() => collaboratorScenes)
    mockContributableDomainsQuery.mockReturnValue({ currentData: [{ name: 'shared.dcl.eth' }], isLoading: false })
    mockDCLNamesQuery.mockReturnValue({ data: ['gabi.dcl.eth'], isLoading: false })
    lands = [createLand('1', 'Sunset Parcel'), createLand('2', 'Harbor Estate')]
    mockLandsQuery.mockImplementation(() => ({ data: lands, isLoading: false }))
    mockRentalsQuery.mockReturnValue({
      data: { tenantRentals: [{ tokenId: 'rented-1' }], lessorRentals: [{ tokenId: 'leased-1' }] },
      isLoading: false
    })
    intersectionCallback = undefined
    stubIntersectionObserver(cb => {
      intersectionCallback = cb
    })
  })

  afterEach(() => {
    window.IntersectionObserver = nativeIntersectionObserver
    jest.resetAllMocks()
  })

  describe('when the worlds tab is active', () => {
    it('should list owned and collaborator worlds and open the editor for the picked one', () => {
      render(<SelectPage />)

      expect(screen.getByRole('button', { name: 'gabi.dcl.eth' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'shared.dcl.eth' }))

      expect(mockNavigate).toHaveBeenCalledWith('/storage/env?realm=shared.dcl.eth&position=10%2C10')
    })

    describe('and a search term matches nothing', () => {
      it('should replace the grid with the no-results copy', () => {
        render(<SelectPage />)

        fireEvent.change(screen.getByLabelText('component.storage.select_page.search_worlds'), { target: { value: 'nope' } })

        expect(screen.getByText('component.storage.select_page.no_search_results')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'gabi.dcl.eth' })).not.toBeInTheDocument()
      })
    })

    describe('and the search is cleared', () => {
      it('should restore the full list', () => {
        render(<SelectPage />)
        fireEvent.change(screen.getByLabelText('component.storage.select_page.search_worlds'), { target: { value: 'nope' } })

        fireEvent.click(screen.getByRole('button', { name: 'clear-component.storage.select_page.search_worlds' }))

        expect(screen.getByRole('button', { name: 'gabi.dcl.eth' })).toBeInTheDocument()
      })
    })
  })

  describe('when the lands tab is active', () => {
    it('should open the env editor for the picked land', () => {
      render(<SelectPage />)
      openTab(/lands/)

      fireEvent.click(screen.getByRole('button', { name: 'Harbor Estate' }))

      expect(mockNavigate).toHaveBeenCalledWith('/storage/env?position=0%2C0')
    })

    describe('and a search term is typed', () => {
      it('should keep only the matching land', () => {
        render(<SelectPage />)
        openTab(/lands/)

        fireEvent.change(screen.getByLabelText('component.storage.select_page.search_lands'), { target: { value: 'harbor' } })

        expect(screen.getByRole('button', { name: 'Harbor Estate' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Sunset Parcel' })).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'clear-component.storage.select_page.search_lands' }))

        expect(screen.getByRole('button', { name: 'Sunset Parcel' })).toBeInTheDocument()
      })
    })

    describe('and the wallet owns no lands', () => {
      it('should show the empty copy', () => {
        lands = []
        render(<SelectPage />)
        openTab(/lands/)

        expect(screen.getByText('component.storage.select_page.no_lands')).toBeInTheDocument()
      })
    })
  })

  describe('when a collaborator scene is picked', () => {
    it('should open the scene editor stamped as collaborator access', () => {
      render(<SelectPage />)
      openCollaborationsTab()

      fireEvent.click(screen.getByRole('button', { name: 'scene-0' }))

      expect(mockNavigate).toHaveBeenCalledWith('/storage/scene?realm=gabi.dcl.eth&position=0%2C0&access=collaborator')
    })

    describe('and the scene lives in Genesis City', () => {
      it('should omit the realm param', () => {
        collaboratorScenes = {
          currentData: {
            data: [{ sceneId: 'genesis-1', worldName: '', baseParcel: '5,5', title: 'Plaza', realmKind: 'genesis' }],
            pagination: { limit: PAGE_SIZE, offset: 0, total: 1 }
          },
          isLoading: false,
          isFetching: false,
          isError: false
        }
        render(<SelectPage />)
        openCollaborationsTab()

        fireEvent.click(screen.getByRole('button', { name: 'genesis-1' }))

        expect(mockNavigate).toHaveBeenCalledWith('/storage/scene?position=5%2C5&access=collaborator')
      })
    })
  })

  describe('when the collaborations query fails', () => {
    it('should show the error copy instead of the empty state', () => {
      collaboratorScenes = { currentData: undefined, isLoading: false, isFetching: false, isError: true }
      render(<SelectPage />)
      openCollaborationsTab()

      expect(screen.getByText('component.storage.select_page.collaborations_error')).toBeInTheDocument()
    })
  })

  describe('when every collaboration fits in the first page', () => {
    it('should render no sentinel to observe', () => {
      collaboratorScenes = {
        currentData: { data: [createScene(0)], pagination: { limit: PAGE_SIZE, offset: 0, total: 1 } },
        isLoading: false,
        isFetching: false,
        isError: false
      }
      render(<SelectPage />)
      openCollaborationsTab()

      expect(window.IntersectionObserver).not.toHaveBeenCalled()
    })
  })

  describe('when the next page is still in flight', () => {
    it('should show the spinner and keep the observer disarmed until it settles', () => {
      const fulfilledOffset = 0
      mockCollaboratorScenesQuery.mockImplementation((arg: { offset?: number }) => ({
        currentData: createPage(fulfilledOffset),
        isLoading: false,
        isFetching: (arg.offset ?? 0) !== fulfilledOffset,
        isError: false
      }))
      render(<SelectPage />)
      openCollaborationsTab()
      const armedForFirstPage = (window.IntersectionObserver as jest.Mock).mock.calls.length

      act(() => {
        intersectionCallback?.([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver)
      })

      expect(screen.getByRole('progressbar', { name: 'component.storage.select_page.loading' })).toBeInTheDocument()
      expect((window.IntersectionObserver as jest.Mock).mock.calls).toHaveLength(armedForFirstPage)
    })
  })

  describe('when the collaborations tab has more pages', () => {
    it('should observe a sentinel instead of rendering a load more button', () => {
      render(<SelectPage />)
      openCollaborationsTab()

      expect(screen.getAllByTestId('collaborator-card')).toHaveLength(PAGE_SIZE)
      expect(screen.getAllByRole('button')).toHaveLength(PAGE_SIZE)
      expect(window.IntersectionObserver).toHaveBeenCalled()
    })

    describe('and the sentinel enters the viewport', () => {
      it('should fetch the next page', () => {
        render(<SelectPage />)
        openCollaborationsTab()

        expect(mockCollaboratorScenesQuery).toHaveBeenCalledWith(
          expect.objectContaining({ limit: PAGE_SIZE, offset: 0 }),
          expect.anything()
        )

        act(() => {
          intersectionCallback?.([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver)
        })

        expect(mockCollaboratorScenesQuery).toHaveBeenCalledWith(
          expect.objectContaining({ limit: PAGE_SIZE, offset: PAGE_SIZE }),
          expect.anything()
        )
      })
    })
  })
})
