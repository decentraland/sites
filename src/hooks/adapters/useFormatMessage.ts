import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import type { PrimitiveType } from 'react-intl'

type FormatValues = Record<string, PrimitiveType | ReactNode | ((chunks: ReactNode) => ReactNode)>

function useFormatMessage() {
  const intl = useIntl()

  return useCallback(
    function format(id?: string | null, values?: FormatValues) {
      if (!id || !intl.messages[id]) {
        return id || ''
      }

      return intl.formatMessage({ id }, values)
    },
    [intl]
  )
}

export { useFormatMessage, useIntl }
