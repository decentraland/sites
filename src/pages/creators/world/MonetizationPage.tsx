import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ComingSoon } from './ComingSoon'

function MonetizationPage() {
  const t = useFormatMessage()
  const { worldName } = useWorldContext()
  return (
    <ComingSoon
      title={t('page.creators.world.nav.monetization')}
      soonLabel={t('page.creators.world.soon')}
      hint={t('page.creators.world.monetization_hint')}
      documentTitle={`${t('page.creators.world.nav.monetization')} · ${worldName}`}
      tileLabels={[t('page.creators.world.monetization.revenue'), t('page.creators.world.monetization.items')]}
    />
  )
}

export { MonetizationPage }
