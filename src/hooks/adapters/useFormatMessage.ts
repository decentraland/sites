import { useCallback } from 'react'
import { useTranslation } from '@dcl/hooks'

function useFormatMessage() {
  const { t } = useTranslation()

  return useCallback(
    function format<TValues extends Record<string, unknown>>(id?: string | null, values?: TValues): string {
      if (!id) {
        return ''
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return t(id, values as any)
    },
    [t]
  )
}

function useIntl() {
  const { intl } = useTranslation()
  return intl
}

export { useFormatMessage, useIntl }
