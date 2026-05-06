import { type ReactNode, useCallback, useMemo } from 'react'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

// Adapter that lets ported cast2 components keep their original `t('key')`
// call sites without rewiring every consumer. Prepends the `page.cast.`
// namespace so the underlying sites translation lookup matches the keys
// added to src/intl/*.
const useCastTranslation = () => {
  const format = useFormatMessage()

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => format(`page.cast.${key}`, values as Record<string, ReactNode> | undefined),
    [format]
  )

  return useMemo(() => ({ t }), [t])
}

export { useCastTranslation }
