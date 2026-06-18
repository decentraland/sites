import { memo } from 'react'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { Card, EmptyState, GridRoot, LoadingRow, Meta, Subtitle, Thumb, ThumbImage, Title } from './NFTGrid.styled'

type NFTRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'exotic' | 'mythic' | 'unique'

interface NFTGridItem {
  id: string
  name: string
  image: string
  subtitle?: string
  href?: string
  rarity?: NFTRarity | string
}

interface NFTGridProps {
  items: readonly NFTGridItem[]
  isLoading: boolean
  emptyTitle: string
  emptyDescription?: string
  onItemClick?: (item: NFTGridItem) => void
}

const NftCard = memo(function NftCard({ item, onClick }: { item: NFTGridItem; onClick?: (item: NFTGridItem) => void }) {
  const handleClick = () => {
    if (onClick) onClick(item)
    else if (item.href && typeof window !== 'undefined') window.open(item.href, '_blank', 'noopener,noreferrer')
  }
  return (
    <Card role="button" tabIndex={0} onClick={handleClick}>
      <Thumb $rarity={item.rarity}>{item.image ? <ThumbImage src={item.image} alt={item.name} loading="lazy" /> : null}</Thumb>
      <Meta>
        <Title>{item.name}</Title>
        {item.subtitle ? <Subtitle>{item.subtitle}</Subtitle> : null}
      </Meta>
    </Card>
  )
})

// eslint-disable-next-line @typescript-eslint/naming-convention -- public React component, three-letter NFT acronym predates the rule
function NFTGrid({ items, isLoading, emptyTitle, emptyDescription, onItemClick }: NFTGridProps) {
  if (isLoading) {
    return (
      <LoadingRow>
        <CircularProgress size={28} />
      </LoadingRow>
    )
  }
  if (items.length === 0) {
    return (
      <EmptyState>
        <Typography variant="h6" color="text.primary">
          {emptyTitle}
        </Typography>
        {emptyDescription ? <Typography variant="body2">{emptyDescription}</Typography> : null}
      </EmptyState>
    )
  }
  return (
    <GridRoot>
      {items.map(item => (
        <NftCard key={item.id} item={item} onClick={onItemClick} />
      ))}
    </GridRoot>
  )
}

export { NFTGrid }
export type { NFTGridItem, NFTGridProps, NFTRarity }
