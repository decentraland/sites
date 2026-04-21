import { type ReactNode, memo } from 'react'
import { useMobileMediaQuery } from 'decentraland-ui2'
import type { CardData, Creator } from '../../../features/jump/jump.types'
import { Card } from '../Card'
import { MobileCard } from '../MobileCard'

interface ResponsiveCardProps {
  data?: CardData
  isLoading?: boolean
  creator?: Creator
  children?: ReactNode
}

const ResponsiveCard = memo(function ResponsiveCard({ data, isLoading = false, creator, children }: ResponsiveCardProps) {
  const isMobile = useMobileMediaQuery()

  if (isMobile) {
    return (
      <MobileCard data={data} isLoading={isLoading} creator={creator}>
        {children}
      </MobileCard>
    )
  }

  return (
    <Card data={data} isLoading={isLoading} creator={creator}>
      {children}
    </Card>
  )
})

export { ResponsiveCard }
export type { ResponsiveCardProps }
