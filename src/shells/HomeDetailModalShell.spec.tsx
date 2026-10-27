import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { createMockEvent } from '../__test-utils__/factories'
import { withMockFetch } from '../__test-utils__/withMockFetch'
import { ExploreCardType } from '../features/events/events.discovery.types'
import { HomeDetailModalShell } from './HomeDetailModalShell'

jest.mock('@dcl/hooks', () => ({
  ...jest.requireActual('@dcl/hooks'),
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-US' }),
  useAnalytics: () => ({ track: () => undefined })
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => `https://${key.toLowerCase()}.example.com`
}))

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 }),
  signedHeaderFactory: () => () => ({})
}))

// shells/store.ts reads import.meta (Vite only), so Jest cannot load it. This is the same assembly with
// the real RTK Query clients, reducers and middleware, which is what the modal's hooks talk to.
jest.mock('./store', () => {
  const { combineReducers, configureStore } = jest.requireActual('@reduxjs/toolkit')
  const { eventsClient } = jest.requireActual('../features/events/events.client')
  const { adminClient } = jest.requireActual('../features/events/events.admin.client')
  const { placesClient } = jest.requireActual('../services/placesClient')
  const { socialClient } = jest.requireActual('../services/socialClient')
  const clients = [eventsClient, adminClient, placesClient, socialClient]
  return {
    store: configureStore({
      reducer: combineReducers(Object.fromEntries(clients.map(client => [client.reducerPath, client.reducer]))),
      middleware: (getDefault: (options?: unknown) => { concat: (...middleware: unknown[]) => unknown }) =>
        getDefault().concat(...clients.map(client => client.middleware))
    })
  }
})

jest.mock('decentraland-ui2/dist/config', () => ({ config: { get: () => undefined } }))
jest.mock('decentraland-ui2/dist/modules/cdnReleases', () => ({ CDNSource: {}, getCDNRelease: jest.fn() }))

// ui2 ships nested ESM that Jest cannot load, so it is stubbed: any export is a passthrough element and
// Dialog renders its children only while open. The store, the hooks and the modal's own logic stay real.
jest.mock('decentraland-ui2', () => {
  const { createElement } = jest.requireActual<typeof React>('react')
  const { createUi2Mock } = jest.requireActual('../__test-utils__/ui2Mock')
  const base = createUi2Mock() as Record<string, unknown>
  const passthrough = ({ children }: { children?: React.ReactNode }) => createElement('div', null, children)
  // Any token path resolves to a colour, so styled files that read tokens at module scope evaluate.
  const anyToken = (): unknown => new Proxy({}, { get: (_target, prop) => (prop === Symbol.toPrimitive ? () => '#000' : anyToken()) })
  const dialog = ({ open, children }: { open?: boolean; children?: React.ReactNode }) =>
    open ? createElement('div', { role: 'dialog' }, children) : null
  return new Proxy(base, {
    get: (target, prop: string) => {
      if (prop === '__esModule') return true
      if (prop === 'Dialog') return dialog
      if (prop === 'dclColors') return anyToken()
      if (prop === 'useTheme') return () => target.fakeTheme
      if (prop === 'useMediaQuery') return () => false
      return prop in target ? target[prop] : passthrough
    }
  })
})

// The in-modal profile/photo/place/community surfaces are not what this spec is about (it proves the store
// reaches the modal's hooks) and are never rendered here, so they are stubbed the way EventDetailModal.spec
// does. Importing them for real would also drag ~100 untested files into the repo coverage denominator.
jest.mock('../components/profile/ProfileSurface', () => ({ ProfileSurface: () => null }))
jest.mock('../components/profile/PhotoModal/PhotoSurface', () => ({ PhotoSurface: () => null }))
jest.mock('../components/profile/PlaceDetailModal/PlaceDetailSurface', () => ({ PlaceDetailSurface: () => null }))
jest.mock('../components/profile/CommunityDetailModal', () => ({ CommunityDetailSurface: () => null }))
jest.mock('../components/profile/ProfileModal', () => {
  const actual = jest.requireActual('../components/profile/ProfileModal/useModalSurfaceStack')
  return {
    ModalProfileNavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useModalSurfaceStack: actual.useModalSurfaceStack,
    useStackDialogClose: actual.useStackDialogClose,
    ModalSurfaceView: () => null
  }
})

// The point of this spec is the REAL store and the REAL EventDetailModal: the modal's hooks
// (remind me, edit permission, profile surfaces) throw without a react-redux Provider, and the
// homepage mounts none, so only a runtime render proves the shell supplies it.
const onClose = jest.fn()
const onError = jest.fn()

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

function renderShell(selection: React.ComponentProps<typeof HomeDetailModalShell>['selection']) {
  return render(
    <MemoryRouter>
      <HomeDetailModalShell selection={selection} onClose={onClose} onError={onError} />
    </MemoryRouter>
  )
}

describe('when rendering the home detail modal shell with the real store', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and an event is selected', () => {
    it('should render the event detail without a missing-store error', async () => {
      const fetchMock = jest
        .fn()
        .mockImplementation(async () => json({ ok: true, data: createMockEvent({ id: 'event-1', name: 'Career Mondays' }) }))
      await withMockFetch(fetchMock, async () => {
        renderShell({ kind: 'event', id: 'event-1' })
        expect(await screen.findByText('Career Mondays')).toBeInTheDocument()
      })
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('and a place is selected', () => {
    it('should render the place detail without a missing-store error', async () => {
      const fetchMock = jest.fn().mockImplementation(async () => json({ ok: true, data: [] }))
      await withMockFetch(fetchMock, async () => {
        renderShell({
          kind: 'place',
          item: {
            type: ExploreCardType.PLACE,
            id: 'place-1',
            title: 'Genesis Plaza',
            users: 7,
            image: 'https://example.com/plaza.png',
            coordinates: '0,0',
            isGenesisPlaza: true
          }
        })
        expect(await screen.findByText('Genesis Plaza')).toBeInTheDocument()
      })
      expect(onError).not.toHaveBeenCalled()
    })
  })
})
