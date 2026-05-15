import { type ReactNode, useMemo } from 'react'
import { useTranslation } from '@dcl/hooks'
import { Tooltip } from 'decentraland-ui2'
import { formatUtcRangeTooltip, formatUtcTooltip } from '../../../utils/whatsOnTime'
import { LocalTimeTrigger } from './LocalDateTimeTooltip.styled'

interface LocalDateTimeTooltipProps {
  startIso: string
  finishIso?: string | null
  children: ReactNode
}

function LocalDateTimeTooltip({ startIso, finishIso, children }: LocalDateTimeTooltipProps) {
  const { t, locale } = useTranslation()
  const body = useMemo(
    () => (finishIso ? formatUtcRangeTooltip(startIso, finishIso, locale, t) : formatUtcTooltip(startIso, locale, t)),
    [startIso, finishIso, locale, t]
  )
  return (
    <Tooltip title={body} arrow placement="top">
      <LocalTimeTrigger tabIndex={0}>{children}</LocalTimeTrigger>
    </Tooltip>
  )
}

export { LocalDateTimeTooltip }
export type { LocalDateTimeTooltipProps }
