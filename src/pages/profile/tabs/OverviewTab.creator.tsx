import { Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useCreatorProfile } from '../../../hooks/useCreatorProfile'

interface CreatorByLineProps {
  address: string
}

function shortenAddress(value: string | undefined): string | undefined {
  if (!value || value.length < 10) return undefined
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function CreatorByLine({ address }: CreatorByLineProps) {
  const t = useFormatMessage()
  const { creatorName } = useCreatorProfile(address, undefined, undefined)
  const label = creatorName ?? shortenAddress(address)
  if (!label) return null
  return (
    <Typography variant="body2" color="text.secondary">
      {t('profile.overview.by_creator', { name: label })}
    </Typography>
  )
}

export { CreatorByLine }
export type { CreatorByLineProps }
