import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerCard } from './PlayerCard'

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
    Card: pass('div'),
    CardActions: pass('footer'),
    CardActionArea: (props: Record<string, unknown>) =>
      h('button', { type: 'button', onClick: props.onClick, 'aria-label': props['aria-label'] }, props.children),
    CardContent: pass('div'),
    Checkbox: (props: Record<string, unknown>) => {
      const inputProps = props.inputProps as { 'aria-label'?: string } | undefined
      return h('input', {
        type: 'checkbox',
        checked: Boolean(props.checked),
        onChange: props.onChange,
        'aria-label': inputProps?.['aria-label']
      })
    },
    Typography: pass('span')
  }
})

jest.mock('@mui/icons-material/FmdGood', () => ({ __esModule: true, default: () => null }))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../features/storage', () => ({
  truncateAddress: (address: string) => `short-${address}`
}))

describe('PlayerCard', () => {
  let address: string
  let onClick: jest.Mock
  let onToggle: jest.Mock

  beforeEach(() => {
    address = '0xabc'
    onClick = jest.fn()
    onToggle = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when onToggle is not provided', () => {
    it('should not render a selection checkbox', () => {
      render(<PlayerCard address={address} onClick={onClick} />)

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('when the card area is clicked', () => {
    it('should call onClick', async () => {
      const user = userEvent.setup()
      render(<PlayerCard address={address} onClick={onClick} onToggle={onToggle} />)

      await user.click(screen.getByRole('button', { name: 'component.storage.player_page.select_player' }))

      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('when onToggle is provided', () => {
    it('should render a selection checkbox', () => {
      render(<PlayerCard address={address} onClick={onClick} onToggle={onToggle} />)

      expect(screen.getByRole('checkbox', { name: 'component.storage.common.select_row' })).toBeInTheDocument()
    })

    it('should render the checkbox before the card area and outside it', () => {
      render(<PlayerCard address={address} onClick={onClick} onToggle={onToggle} />)

      const checkbox = screen.getByRole('checkbox', { name: 'component.storage.common.select_row' })
      const cardArea = screen.getByRole('button', { name: 'component.storage.player_page.select_player' })

      expect(cardArea).not.toContainElement(checkbox)
      expect(checkbox.compareDocumentPosition(cardArea) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    describe('and the card is selected', () => {
      it('should render the checkbox as checked', () => {
        render(<PlayerCard address={address} onClick={onClick} onToggle={onToggle} selected />)

        expect(screen.getByRole('checkbox', { name: 'component.storage.common.select_row' })).toBeChecked()
      })
    })

    describe('and the checkbox is clicked', () => {
      let user: ReturnType<typeof userEvent.setup>

      beforeEach(async () => {
        user = userEvent.setup()
        render(<PlayerCard address={address} onClick={onClick} onToggle={onToggle} />)
        await user.click(screen.getByRole('checkbox', { name: 'component.storage.common.select_row' }))
      })

      it('should call onToggle with the player address', () => {
        expect(onToggle).toHaveBeenCalledWith('0xabc')
      })

      it('should not call onClick', () => {
        expect(onClick).not.toHaveBeenCalled()
      })
    })
  })
})
