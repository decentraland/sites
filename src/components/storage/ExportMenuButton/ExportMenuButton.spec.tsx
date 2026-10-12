import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportMenuButton } from './ExportMenuButton'

jest.mock('decentraland-ui2', () => {
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  return {
    Button: (props: Record<string, unknown>) =>
      h('button', { type: 'button', onClick: props.onClick, disabled: props.disabled }, props.startIcon, props.children),
    CircularProgress: (props: Record<string, unknown>) => h('div', { role: 'progressbar', 'aria-label': props['aria-label'] }),
    Menu: (props: Record<string, unknown>) =>
      props.open
        ? h('div', { role: 'menu' }, [
            h('button', { key: 'close', type: 'button', 'aria-label': 'close-menu', onClick: props.onClose }, 'close'),
            h('div', { key: 'items' }, props.children)
          ])
        : null,
    MenuItem: (props: Record<string, unknown>) => h('button', { type: 'button', role: 'menuitem', onClick: props.onClick }, props.children)
  }
})

jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => null }))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

describe('ExportMenuButton', () => {
  let onSelect: jest.Mock
  let busy: boolean
  let disabled: boolean

  const renderButton = () => render(<ExportMenuButton label="Download all" busy={busy} disabled={disabled} onSelect={onSelect} />)

  beforeEach(() => {
    onSelect = jest.fn()
    busy = false
    disabled = false
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it renders', () => {
    it('should show the label on the button', () => {
      renderButton()

      expect(screen.getByRole('button', { name: 'Download all' })).toBeInTheDocument()
    })

    it('should keep the format menu closed', () => {
      renderButton()

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('when the button is clicked', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      renderButton()
      await user.click(screen.getByRole('button', { name: 'Download all' }))
    })

    it('should offer the JSON and CSV formats', () => {
      expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
        'component.storage.common.format_json',
        'component.storage.common.format_csv'
      ])
    })

    describe('and JSON is chosen', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_json' }))
      })

      it('should call onSelect with json', () => {
        expect(onSelect).toHaveBeenCalledWith('json')
      })

      it('should close the menu', () => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })
    })

    describe('and CSV is chosen', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_csv' }))
      })

      it('should call onSelect with csv', () => {
        expect(onSelect).toHaveBeenCalledWith('csv')
      })

      it('should close the menu', () => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })
    })

    describe('and the menu is dismissed', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: 'close-menu' }))
      })

      it('should close the menu', () => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })

      it('should not call onSelect', () => {
        expect(onSelect).not.toHaveBeenCalled()
      })
    })
  })

  describe('when busy', () => {
    beforeEach(() => {
      busy = true
    })

    it('should disable the button', () => {
      renderButton()

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should show a progressbar labelled as exporting', () => {
      renderButton()

      expect(screen.getByRole('progressbar', { name: 'component.storage.common.exporting' })).toBeInTheDocument()
    })
  })

  describe('when not busy', () => {
    it('should not show a progressbar', () => {
      renderButton()

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('when disabled', () => {
    beforeEach(() => {
      disabled = true
    })

    it('should not open the menu on click', async () => {
      const user = userEvent.setup()
      renderButton()

      await user.click(screen.getByRole('button', { name: 'Download all' }))

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })
})
