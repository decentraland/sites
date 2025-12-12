import { memo } from 'react'
import { BannerButtonProps } from './BannerButton.types'
import { BannerButtonStyled } from './BannerButton.styled'

const BannerButton = memo((props: BannerButtonProps) => {
  const { href, onClick, label, eventPlace, variant = 'contained', color = 'primary', metadata } = props
  return (
    <BannerButtonStyled
      variant={variant}
      color={color}
      data-place={eventPlace}
      data-title={metadata.title}
      data-subtitle={metadata.subtitle}
      data-sub-section={metadata.subSection}
      href={href}
      onClick={onClick}
    >
      {label}
    </BannerButtonStyled>
  )
})

export { BannerButton }
