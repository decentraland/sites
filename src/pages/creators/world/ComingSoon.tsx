import { Helmet } from 'react-helmet-async'
import {
  ComingSoonHint,
  PlaceholderStrip,
  SectionCard,
  SectionHeaderRow,
  SectionTitle,
  SoonBadge,
  StatLabel,
  StatTile,
  StatValue
} from './world.styled'

interface ComingSoonProps {
  title: string
  soonLabel: string
  hint: string
  tileLabels: string[]
  documentTitle: string
}

const DASH = '—'

// Shared placeholder body for the Analytics + Monetization tabs — empty KPI
// tiles until the metrics / sales pipelines land (Roblox's "No data" state).
function ComingSoon(props: ComingSoonProps) {
  const { title, soonLabel, hint, tileLabels, documentTitle } = props
  return (
    <SectionCard>
      <Helmet>
        <title>{documentTitle}</title>
      </Helmet>
      <SectionHeaderRow>
        <SectionTitle>{title}</SectionTitle>
        <SoonBadge>{soonLabel}</SoonBadge>
      </SectionHeaderRow>
      <ComingSoonHint>{hint}</ComingSoonHint>
      <PlaceholderStrip>
        {tileLabels.map(label => (
          <StatTile key={label}>
            <StatValue>{DASH}</StatValue>
            <StatLabel>{label}</StatLabel>
          </StatTile>
        ))}
      </PlaceholderStrip>
    </SectionCard>
  )
}

export { ComingSoon }
