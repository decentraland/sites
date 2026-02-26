import { memo, useEffect, useRef } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Pagination } from 'swiper/modules'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorsCreateCard } from './CreatorsCreateCard'
import type { CreatorsCreateProps } from './CreatorsCreate.types'
import {
  CreatorsCreateSection,
  CreatorsCreateSwiperSlideStyled,
  CreatorsCreateSwiperStyled,
  CreatorsCreateTitle
} from './CreatorsCreate.styled'

const CreatorsCreate = memo(({ items }: CreatorsCreateProps) => {
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
    <CreatorsCreateSection ref={sectionRef}>
      <CreatorsCreateTitle variant="h2">
        {l('component.creators_landing.create.title')}
        <span>{l('component.creators_landing.create.title_hightlight')}</span>
        {l('component.creators_landing.create.title_second_part')}
      </CreatorsCreateTitle>

      <CreatorsCreateSwiperStyled
        modules={[Pagination]}
        slidesPerView="auto"
        centeredSlides
        pagination={{ clickable: true }}
        spaceBetween={24}
      >
        {items.list.map(item => (
          <CreatorsCreateSwiperSlideStyled key={item.id}>
            <CreatorsCreateCard item={item} />
          </CreatorsCreateSwiperSlideStyled>
        ))}
      </CreatorsCreateSwiperStyled>
    </CreatorsCreateSection>
  )
})

export { CreatorsCreate }
export type { CreatorsCreateProps }
