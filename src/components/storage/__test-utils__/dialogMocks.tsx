import { createElement, forwardRef, useEffect, useImperativeHandle, useState } from 'react'
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

  Button: ({ children, ...rest }: Record<string, unknown> & { children?: ReactNode }) =>
    createElement('button', { type: 'button', ...stripVisualProps(rest) }, children),

  Checkbox: (props: Record<string, unknown>) => {
    const { checked, indeterminate, onChange, disabled, inputProps } = props as {
      checked?: boolean
      indeterminate?: boolean
      onChange?: () => void
      disabled?: boolean
      inputProps?: Record<string, unknown>
    }
    return createElement('input', {
      ...inputProps,
      type: 'checkbox',
      checked: Boolean(checked),
      disabled,
      ['data-indeterminate']: String(Boolean(indeterminate)),
      onChange
    })
  },

  IconButton: ({ children, ...rest }: Record<string, unknown> & { children?: ReactNode }) =>
    createElement('button', { type: 'button', ...stripVisualProps(rest) }, children),

  Menu: (props: Record<string, unknown>) => {
    const { open, children } = props as { open: boolean; children: ReactNode }
    return open ? createElement('div', { role: 'menu' }, children) : null
  },
  MenuItem: ({ children, ...rest }: Record<string, unknown> & { children?: ReactNode }) =>
    createElement('button', { type: 'button', role: 'menuitem', ...stripVisualProps(rest) }, children),

  Dialog: (props: Record<string, unknown>) => {
    const { open, children } = props as { open: boolean; children: ReactNode }
    return open ? createElement('div', null, children) : null
  },
  DialogActions: passthrough('div'),
  DialogContent: passthrough('div'),
  DialogContentText: ({ children, id }: { children?: ReactNode; id?: string }) => createElement('div', { id }, children),
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

interface StorageValueFieldMockRef {
  reset: () => void
  getParsedValue: () => string | null
}

interface StorageValueFieldMockProps {
  onChange?: (e: { isValid: boolean; parsedValue: string | null }) => void
  label?: string
}

/**
 * Shared mock for the real `StorageValueField` (which mounts MUI's TextField
 * with multiline/rows props that aren't supported by the lightweight dialog
 * mock). Exposes the same `reset` / `getParsedValue` imperative handle, and
 * surfaces a plain text input so specs can drive it with `fireEvent.change`.
 */
const storageValueFieldMockFactory = () => ({
  StorageValueField: forwardRef<StorageValueFieldMockRef, StorageValueFieldMockProps>((props, ref) => {
    const [raw, setRaw] = useState('')
    useImperativeHandle(ref, () => ({
      reset: () => setRaw(''),
      getParsedValue: () => (raw.trim() ? raw : null)
    }))
    useEffect(() => {
      props.onChange?.({ isValid: raw.trim().length > 0, parsedValue: raw.trim() ? raw : null })
    }, [raw])
    return createElement('input', {
      ['aria-label']: props.label ?? 'storage-value-field',
      value: raw,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setRaw(e.target.value)
    })
  })
})

export { dialogMockFactory, storageValueFieldMockFactory }
export type { StorageValueFieldMockRef, StorageValueFieldMockProps }
