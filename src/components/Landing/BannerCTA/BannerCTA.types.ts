import { ContentfulBannerCTAEntryFieldsProps } from '../../../features/landing/landing.types'
import { SegmentEvent } from '../../../modules/segment'

type BannerCTAProps = ContentfulBannerCTAEntryFieldsProps & {
  eventPlace: SegmentEvent
  isDesktop: boolean
  isLoggedIn: boolean
}

export type { BannerCTAProps }
