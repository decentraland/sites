import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CollaboratorScene } from '../../../features/storage'
import { CollaboratorSceneCard } from './CollaboratorSceneCard'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  const pass =
    (tag: string) =>
    ({ children }: { children?: unknown }) =>
      h(tag, null, children)
  return {
    ...actual,
    Box: pass('div'),
    Button: (props: Record<string, unknown>) =>
      h('button', { type: 'button', onClick: props.onClick, disabled: props.disabled, 'aria-label': props['aria-label'] }, props.children),
    Card: pass('div'),
    CardActions: pass('div'),
    CardContent: pass('div'),
    Chip: (props: Record<string, unknown>) => h('span', null, props.label),
    Typography: pass('span')
  }
})

jest.mock('@mui/icons-material/FmdGood', () => ({ __esModule: true, default: () => null }))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const worldScene: CollaboratorScene = {
  sceneId: 's1',
  worldName: 'my-world.dcl.eth',
  baseParcel: '10,20',
  title: 'My Scene',
  realmKind: 'world'
}
const genesisScene: CollaboratorScene = {
  sceneId: 's2',
  worldName: '',
  baseParcel: '5,7',
  title: null,
  realmKind: 'genesis'
}
const editButton = () => screen.getByRole('button', { name: 'component.storage.select_page.edit' })

describe('CollaboratorSceneCard', () => {
  afterEach(() => jest.resetAllMocks())

  it('renders the scene title and its world location', () => {
    render(<CollaboratorSceneCard scene={worldScene} onEditClick={jest.fn()} />)
    expect(screen.getByText('My Scene')).toBeInTheDocument()
    expect(screen.getByText('my-world.dcl.eth · 10,20')).toBeInTheDocument()
  })

  it('falls back to the base parcel when the scene has no title', () => {
    render(<CollaboratorSceneCard scene={genesisScene} onEditClick={jest.fn()} />)
    expect(screen.getByText('5,7')).toBeInTheDocument()
  })

  it('shows the base parcel under the title of a titled Genesis City scene', () => {
    render(<CollaboratorSceneCard scene={{ ...genesisScene, title: 'Plaza' }} onEditClick={jest.fn()} />)
    expect(screen.getByText('Plaza')).toBeInTheDocument()
    expect(screen.getByText('5,7')).toBeInTheDocument()
  })

  it('labels a world scene with the World realm chip', () => {
    render(<CollaboratorSceneCard scene={worldScene} onEditClick={jest.fn()} />)
    expect(screen.getByText('component.storage.select_page.realm_world')).toBeInTheDocument()
  })

  it('labels a Genesis City scene with the Genesis City realm chip', () => {
    render(<CollaboratorSceneCard scene={genesisScene} onEditClick={jest.fn()} />)
    expect(screen.getByText('component.storage.select_page.realm_genesis')).toBeInTheDocument()
  })

  it('hands the whole scene to onEditClick when Edit is clicked', async () => {
    const onEditClick = jest.fn()
    render(<CollaboratorSceneCard scene={worldScene} onEditClick={onEditClick} />)
    await userEvent.click(editButton())
    expect(onEditClick).toHaveBeenCalledWith(worldScene)
  })

  it('renders an HTML-looking title as text rather than markup', () => {
    const malicious = '<img src=x onerror=alert(1)>'
    render(<CollaboratorSceneCard scene={{ ...worldScene, title: malicious }} onEditClick={jest.fn()} />)
    expect(screen.getByText(malicious)).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })
})
