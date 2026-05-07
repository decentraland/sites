/* eslint-disable @typescript-eslint/naming-convention */
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { useCastTranslation } from '../../../features/media/cast/useCastTranslation'
import { CounterContainer, LivePill } from './LiveStreamCounter.styled'

export function LiveStreamCounter() {
  const { t } = useCastTranslation()

  return (
    <CounterContainer>
      <LivePill>
        <FiberManualRecordIcon />
        {t('live_counter.live')}
      </LivePill>
    </CounterContainer>
  )
}
