type BannerButtonProps = {
  href: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  label: string
  eventPlace: string
  metadata: Partial<Record<'title' | 'subtitle' | 'subSection', string>>
  variant?: 'text' | 'outlined' | 'contained'
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
}

export type { BannerButtonProps }
