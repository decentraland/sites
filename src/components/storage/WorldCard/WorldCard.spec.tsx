import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorldCard } from './WorldCard'

const mockUseGetWorldScenes = jest.fn()

jest.mock('decentraland-ui2', () => {
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  const pass =
    (tag: string) =>
    ({ children }: { children?: unknown }) =>
      h(tag, null, children)
  const button = (props: Record<string, unknown>) =>
    h('button', { type: 'button', onClick: props.onClick, disabled: props.disabled, 'aria-label': props['aria-label'] }, props.children)
  return {
    Box: pass('div'),
    Button: button,
    ButtonBase: (props: Record<string, unknown>) =>
      h('span', { role: 'button', onClick: props.onClick, 'aria-label': props['aria-label'] }, props.children),
    Card: pass('div'),
    CardActions: pass('div'),
    CardContent: pass('div'),
    Chip: (props: Record<string, unknown>) => h('span', null, props.label),
    CircularProgress: () => h('div', { role: 'progressbar' }),
    Menu: (props: Record<string, unknown>) =>
      props.open
        ? h('div', null, [
            h('button', { key: 'close', type: 'button', 'aria-label': 'close-menu', onClick: props.onClose }, 'close'),
            h('div', { key: 'items' }, props.children)
          ])
        : null,
    MenuItem: (props: Record<string, unknown>) =>
      h('button', { type: 'button', role: 'menuitem', onClick: props.onClick, disabled: props.disabled }, props.children),
    Typography: pass('span')
  }
})

jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/FmdGood', () => ({ __esModule: true, default: () => null }))

jest.mock('./WorldCard.styled', () => {
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  return {
    CardLabel: ({ children }: { children?: unknown }) => h('div', null, children),
    MenuDivider: () => null
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../features/storage', () => ({
  useGetWorldScenesQuery: (arg: unknown) => mockUseGetWorldScenes(arg)
}))

const world = { name: 'my-world.dcl.eth', role: 'owner' as const }
const editButton = () => screen.getByRole('button', { name: 'component.storage.select_page.edit' })

describe('WorldCard', () => {
  afterEach(() => jest.clearAllMocks())

  it('disables Edit while the scene list is loading', () => {
    mockUseGetWorldScenes.mockReturnValue({ data: undefined, isLoading: true })
    render(<WorldCard world={world} onEditClick={jest.fn()} />)
    expect(editButton()).toBeDisabled()
  })

  it('disables Edit when the world has no scenes (no base parcel to resolve)', () => {
    mockUseGetWorldScenes.mockReturnValue({ data: [], isLoading: false })
    render(<WorldCard world={world} onEditClick={jest.fn()} />)
    expect(editButton()).toBeDisabled()
  })

  it('sends the resolved base parcel (never 0,0) when Edit is clicked on a single-scene world', async () => {
    mockUseGetWorldScenes.mockReturnValue({ data: [{ title: 'Main', baseParcel: '100,100' }], isLoading: false })
    const onEditClick = jest.fn()
    render(<WorldCard world={world} onEditClick={onEditClick} />)
    await userEvent.click(editButton())
    expect(onEditClick).toHaveBeenCalledWith('my-world.dcl.eth', '100,100')
  })

  it('lets a multi-scene world pick a specific scene base from the dropdown', async () => {
    mockUseGetWorldScenes.mockReturnValue({
      data: [
        { title: 'A', baseParcel: '0,0' },
        { title: 'B', baseParcel: '5,7' }
      ],
      isLoading: false
    })
    const onEditClick = jest.fn()
    render(<WorldCard world={world} onEditClick={onEditClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'component.storage.select_page.select_scene' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'B' }))
    expect(onEditClick).toHaveBeenCalledWith('my-world.dcl.eth', '5,7')
  })

  it('closes the scene menu without navigating', async () => {
    mockUseGetWorldScenes.mockReturnValue({
      data: [
        { title: 'A', baseParcel: '0,0' },
        { title: 'B', baseParcel: '5,7' }
      ],
      isLoading: false
    })
    const onEditClick = jest.fn()
    render(<WorldCard world={world} onEditClick={onEditClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'component.storage.select_page.select_scene' }))
    expect(screen.getByRole('menuitem', { name: 'B' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'close-menu' }))
    expect(screen.queryByRole('menuitem', { name: 'B' })).not.toBeInTheDocument()
    expect(onEditClick).not.toHaveBeenCalled()
  })
})
