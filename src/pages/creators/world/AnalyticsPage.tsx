import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ComingSoon } from './ComingSoon'

function AnalyticsPage() {
  const t = useFormatMessage()
  const { worldName } = useWorldContext()
  return (
    <ComingSoon
      title={t('page.creators.world.nav.analytics')}
      soonLabel={t('page.creators.world.soon')}
      hint={t('page.creators.world.analytics_hint')}
      documentTitle={`${t('page.creators.world.nav.analytics')} · ${worldName}`}
      tileLabels={[
        t('page.creators.world.analytics.visits'),
        t('page.creators.world.analytics.unique_players'),
        t('page.creators.world.analytics.avg_session'),
        t('page.creators.world.analytics.peak_concurrent')
      ]}
    />
  )
}

export { AnalyticsPage }
