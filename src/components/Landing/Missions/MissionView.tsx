import { memo, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { MissionViewProps } from './Missions.types'
import { Mission } from './MissionView.styled'

const MissionView = memo((props: MissionViewProps) => {
  const { id, onIsInView } = props

  const [sectionInView, sectionIsInView] = useInView({
    threshold: 0.5
  })

  useEffect(() => {
    if (sectionIsInView) {
      onIsInView()
    }
  }, [sectionIsInView, onIsInView])

  return <Mission ref={sectionInView} data-index={id}></Mission>
})

export { MissionView }
