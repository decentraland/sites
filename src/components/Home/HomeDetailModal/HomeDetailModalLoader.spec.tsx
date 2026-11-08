import React from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreCardType } from '../../../features/events/events.discovery.types'
import { HomeDetailModalLoader } from './HomeDetailModalLoader'
import type { HomeDetailSelection } from './HomeDetailModal.types'

interface ShellProps {
  selection: HomeDetailSelection
  onClose: () => void
  onError: (error: unknown) => void
}

const mockImportShell = jest.fn()
let mockShellFactory: (() => Promise<unknown>) | undefined
jest.mock('../../../utils/lazyWithRetry', () => ({
  lazyWithRetry: (factory: () => Promise<unknown>) => {
    mockShellFactory = factory
    return jest.requireActual<typeof React>('react').lazy(() => mockImportShell())
  }
}))

jest.mock('../../../shells/HomeDetailModalShell', () => ({ HomeDetailModalShell: () => null }))

jest.mock('./HomeDetailPendingOverlay', () => ({
  HomeDetailPendingOverlay: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pending-overlay">
      <button onClick={onClose}>close pending</button>
    </div>
  )
}))

const Shell = ({ selection, onClose, onError }: ShellProps) => (
  <div data-testid="shell">
    <span data-testid="shell-selection">{selection.kind === 'event' ? selection.id : selection.item.coordinates}</span>
    <button onClick={onClose}>close shell</button>
    <button onClick={() => onError(new Error('modal failed'))}>fail shell</button>
  </div>
)

const eventSelection: HomeDetailSelection = { kind: 'event', id: 'event-1' }
const placeSelection: HomeDetailSelection = {
  kind: 'place',
  item: {
    type: ExploreCardType.PLACE,
    id: 'place-1',
    title: 'Plaza',
    users: 3,
    image: '',
    coordinates: '1,2',
    isGenesisPlaza: false
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const CurrentLocation = () => {
  const location = useLocation()
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

const onClose = jest.fn()

function renderLoader(selection: HomeDetailSelection | null) {
  const tree = (current: HomeDetailSelection | null) => (
    <MemoryRouter initialEntries={['/']}>
      <HomeDetailModalLoader selection={current} onClose={onClose} />
      <CurrentLocation />
    </MemoryRouter>
  )
  const view = render(tree(selection))
  return { ...view, rerenderWith: (next: HomeDetailSelection | null) => view.rerender(tree(next)) }
}

describe('when rendering the home detail modal loader', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the lazy factory is invoked', () => {
    beforeEach(() => {
      renderLoader(null)
    })

    it('should resolve the shell module as the default export', async () => {
      await expect(mockShellFactory?.()).resolves.toEqual({ default: expect.any(Function) })
    })
  })

  describe('and nothing is selected', () => {
    beforeEach(() => {
      renderLoader(null)
    })

    it('should render nothing and never import the shell', () => {
      expect(screen.queryByTestId('pending-overlay')).toBeNull()
      expect(screen.queryByTestId('shell')).toBeNull()
      expect(mockImportShell).not.toHaveBeenCalled()
    })
  })

  describe('and the shell import is still pending', () => {
    let shellImport: ReturnType<typeof deferred<{ default: typeof Shell }>>

    beforeEach(() => {
      shellImport = deferred()
      mockImportShell.mockReturnValue(shellImport.promise)
    })

    describe('and a card has just been selected', () => {
      beforeEach(() => {
        renderLoader(eventSelection)
      })

      it('should show the pending overlay immediately and keep the homepage location', async () => {
        expect(screen.getByTestId('pending-overlay')).toBeInTheDocument()
        expect(screen.queryByTestId('shell')).toBeNull()
        expect(screen.getByTestId('location')).toHaveTextContent('/')
        await act(async () => shellImport.resolve({ default: Shell }))
      })

      describe('and the shell then loads', () => {
        beforeEach(async () => {
          await act(async () => shellImport.resolve({ default: Shell }))
        })

        it('should swap the overlay for the shell with the selection', () => {
          expect(screen.queryByTestId('pending-overlay')).toBeNull()
          expect(screen.getByTestId('shell-selection')).toHaveTextContent('event-1')
        })
      })
    })

    describe('and the overlay is closed before the shell loads', () => {
      let view: ReturnType<typeof renderLoader>

      beforeEach(async () => {
        view = renderLoader(eventSelection)
        await userEvent.click(screen.getByText('close pending'))
        view.rerenderWith(null)
        await act(async () => shellImport.resolve({ default: Shell }))
      })

      it('should call onClose', () => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })

      it('should not render a late modal nor navigate away', () => {
        expect(screen.queryByTestId('shell')).toBeNull()
        expect(screen.getByTestId('location')).toHaveTextContent('/')
      })
    })

    describe('and another card is selected before the shell loads', () => {
      beforeEach(async () => {
        const view = renderLoader(eventSelection)
        view.rerenderWith(placeSelection)
        await act(async () => shellImport.resolve({ default: Shell }))
      })

      it('should render the latest selection', () => {
        expect(screen.getByTestId('shell-selection')).toHaveTextContent('1,2')
      })
    })
  })

  describe('and the shell import fails', () => {
    beforeEach(() => {
      mockImportShell.mockRejectedValue(new Error('chunk failed'))
    })

    describe('and an event was selected', () => {
      beforeEach(async () => {
        renderLoader(eventSelection)
        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/events?id=event-1'))
      })

      it('should close the overlay, log the error and fall back to the events page in the same tab', () => {
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(console.error).toHaveBeenCalledWith('[HomeDetailModal] could not open the detail in place', expect.any(Error))
        expect(screen.queryByTestId('pending-overlay')).toBeNull()
      })
    })

    describe('and a place was selected', () => {
      beforeEach(async () => {
        renderLoader(placeSelection)
        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/places/place/1,2'))
      })

      it('should fall back to the place page', () => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the next card is selected afterwards', () => {
      beforeEach(async () => {
        const view = renderLoader(eventSelection)
        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/events?id=event-1'))
        view.rerenderWith(null)
        mockImportShell.mockResolvedValue({ default: Shell })
        view.rerenderWith(placeSelection)
      })

      it('should import the shell again instead of reusing the rejected one', async () => {
        expect(await screen.findByTestId('shell')).toBeInTheDocument()
        expect(mockImportShell).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('and the shell reports that the modal could not load', () => {
    beforeEach(async () => {
      mockImportShell.mockResolvedValue({ default: Shell })
      renderLoader(eventSelection)
      await userEvent.click(await screen.findByText('fail shell'))
    })

    it('should fall back to the canonical page', () => {
      expect(screen.getByTestId('location')).toHaveTextContent('/events?id=event-1')
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the shell closes itself', () => {
    beforeEach(async () => {
      mockImportShell.mockResolvedValue({ default: Shell })
      renderLoader(eventSelection)
      await userEvent.click(await screen.findByText('close shell'))
    })

    it('should call onClose without navigating', () => {
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('location')).toHaveTextContent('/')
    })
  })
})
