import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'

type FormatMessageValues = Record<string, string | number | boolean | ReactNode | ((chunks: ReactNode) => ReactNode) | undefined>

export function useFormatMessage() {
  const intl = useIntl()

  return (key: string, values?: FormatMessageValues) => {
    return intl.formatMessage({ id: key }, values)
  }
}
