import { createElement } from 'react'
import type { ChangeEvent, ReactNode } from 'react'

/**
 * Shared mock for `decentraland-ui2`'s dialog primitives. The dialogs tested here
 * use Dialog/DialogTitle/DialogContent/DialogActions/Button/Alert/TextField; the
 * stylesheet pulled in by the real package crashes ts-jest because it ships ESM,
 * so we ship light-weight DOM stand-ins that preserve the props the tests assert on.
 *
 * Each prop the real component accepts but we don't render (sx, variant, fullWidth, …)
 * is consumed so it never leaks onto the DOM and trips React's unknown-prop warning.
 */
const ignoredVisualProps = new Set([
  'sx',
  'severity',
  'fullWidth',
  'variant',
  'disableElevation',
  'autoFocus',
  'margin',
  'maxWidth',
  'color',
  'fontWeight',
  'gutterBottom',
  'startIcon',
  'endIcon'
])

const stripVisualProps = (props: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (!ignoredVisualProps.has(key)) out[key] = props[key]
  }
  return out
}

const passthrough =
  (tag: string) =>
  ({ children, ...rest }: Record<string, unknown> & { children?: ReactNode }) =>
    createElement(tag, stripVisualProps(rest), children)

const dialogMockFactory = (): Record<string, unknown> => ({
  Alert: passthrough('div'),
  Box: passthrough('div'),
  CircularProgress: () => createElement('div', { role: 'progressbar' }),

  Button: (props: Record<string, unknown>) => {
    const { children, onClick, disabled } = props as {
      children?: ReactNode
      onClick?: () => void
      disabled?: boolean
    }
    return createElement('button', { type: 'button', onClick, disabled }, children)
  },

  Dialog: (props: Record<string, unknown>) => {
    const { open, children } = props as { open: boolean; children: ReactNode }
    return open ? createElement('div', null, children) : null
  },
  DialogActions: passthrough('div'),
  DialogContent: passthrough('div'),
  DialogTitle: passthrough('h2'),

  TextField: (props: Record<string, unknown>) => {
    const { label, value, onChange, disabled } = props as {
      label: string
      value: string
      onChange?: (e: { target: { value: string } }) => void
      disabled?: boolean
    }
    const id = `field-${label}`.replace(/\s+/g, '-')
    return createElement(
      'label',
      { htmlFor: id },
      label,
      createElement('input', {
        id,
        ['aria-label']: label,
        value,
        disabled,
        onChange: (e: ChangeEvent<HTMLInputElement>) => onChange?.({ target: { value: e.target.value } })
      })
    )
  }
})

export { dialogMockFactory }
