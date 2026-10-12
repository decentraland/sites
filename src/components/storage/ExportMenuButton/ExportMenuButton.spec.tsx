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
    Button: ({ startIcon, children, endIcon: _endIcon, variant: _variant, size: _size, ...rest }: Record<string, unknown>) =>
      h('button', { type: 'button', ...rest }, startIcon, children),
    CircularProgress: (props: Record<string, unknown>) => h('div', { role: 'progressbar', 'aria-hidden': props['aria-hidden'] }),
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

jest.mock('./ExportMenuButton.styled', () => {
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  return {
    ExportMenuRoot: (props: Record<string, unknown>) => h('div', null, props.children),
    ExportStatus: (props: Record<string, unknown>) => h('span', { role: props.role }, props.children)
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

describe('ExportMenuButton', () => {
  let onSelect: jest.Mock
  let busy: boolean

  const renderButton = () => render(<ExportMenuButton label="Download all" busy={busy} onSelect={onSelect} />)

  beforeEach(() => {
    onSelect = jest.fn()
    busy = false
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
    let button: HTMLElement

    beforeEach(() => {
      busy = true
      renderButton()
      button = screen.getByRole('button', { name: 'Download all' })
    })

    it('should mark the button as aria-disabled', () => {
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should mark the button as aria-busy', () => {
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should not disable the button natively', () => {
      expect(button).not.toBeDisabled()
    })

    it('should keep the button focusable', () => {
      button.focus()

      expect(button).toHaveFocus()
    })

    it('should not open the menu on click', async () => {
      await userEvent.setup().click(button)

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should announce the exporting and keep-open copy in the status region', () => {
      expect(screen.getByRole('status')).toHaveTextContent('component.storage.common.exporting component.storage.common.keep_page_open')
    })

    it('should hide the spinner from assistive technology', () => {
      expect(screen.getByRole('progressbar', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('when not busy', () => {
    beforeEach(() => {
      renderButton()
    })

    it('should not show a progressbar', () => {
      expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument()
    })

    it('should keep an empty status region mounted', () => {
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it('should not mark the button as aria-disabled', () => {
      expect(screen.getByRole('button', { name: 'Download all' })).not.toHaveAttribute('aria-disabled')
    })
  })
})
