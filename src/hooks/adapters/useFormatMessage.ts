import { useCallback } from 'react'
import { useIntl } from 'react-intl'

function useFormatMessage() {
  const intl = useIntl()

  return useCallback(
    function format<TValues extends Record<string, unknown>>(id?: string | null, values?: TValues): string {
      if (!id || !intl.messages[id]) {
        return id || ''
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return intl.formatMessage({ id }, values as any)
    },
    [intl]
  )
}

export { useFormatMessage, useIntl }
