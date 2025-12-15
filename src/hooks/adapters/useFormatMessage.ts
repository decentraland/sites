import { useCallback } from 'react'
import { useIntl } from 'react-intl'

function useFormatMessage() {
  const intl = useIntl()

  return useCallback(
    function format<TValues extends Record<string, unknown>>(id?: string | null, values?: TValues) {
      if (!id || !intl.messages[id]) {
        return id || ''
      }

      return intl.formatMessage({ id }, { ...values })
    },
    [intl]
  )
}

export { useFormatMessage, useIntl }
