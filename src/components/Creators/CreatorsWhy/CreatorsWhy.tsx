import { memo, useEffect, useRef } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Pagination } from 'swiper/modules'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorsWhyCard } from './CreatorsWhyCard'
import type { CreatorsWhyProps } from './CreatorsWhy.types'
import {
  CreatorsWhyCarousel,
  CreatorsWhyGrid,
  CreatorsWhySection,
  CreatorsWhySwiperSlideStyled,
  CreatorsWhySwiperStyled,
  CreatorsWhyTitle
} from './CreatorsWhy.styled'

const CreatorsWhy = memo(({ items }: CreatorsWhyProps) => {
  const l = useFormatMessage()
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // section viewed tracking
        }
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <CreatorsWhySection ref={sectionRef}>
      <CreatorsWhyTitle variant="h2">
        <span>{l('component.creators_landing.why.title_hightlight')}</span> {l('component.creators_landing.why.title')}
      </CreatorsWhyTitle>

      <CreatorsWhyGrid>
        {items.list.map(item => (
          <CreatorsWhyCard key={item.id} item={item} />
        ))}
      </CreatorsWhyGrid>

      <CreatorsWhyCarousel>
        <CreatorsWhySwiperStyled modules={[Pagination]} slidesPerView={1} pagination={{ clickable: true }} spaceBetween={16}>
          {items.list.map(item => (
            <CreatorsWhySwiperSlideStyled key={item.id}>
              <CreatorsWhyCard item={item} />
            </CreatorsWhySwiperSlideStyled>
          ))}
        </CreatorsWhySwiperStyled>
      </CreatorsWhyCarousel>
    </CreatorsWhySection>
  )
})

export { CreatorsWhy }
export type { CreatorsWhyProps }
