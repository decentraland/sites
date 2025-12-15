import { Fragment, memo, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { ContentfulMissionsListProps } from '../../../features/landing/landing.types'
import { SegmentEvent } from '../../../modules/segment'
import { MissionDetail } from './MissionDetail'
import { MissionVideo } from './MissionVideo'
import { MissionView } from './MissionView'
import { MissionType } from './Missions.types'
import { MissionsContainer, MissionsSection } from './Missions.styled'

const Missions = memo((props: { missions: ContentfulMissionsListProps; isDesktop: boolean; isLoggedIn: boolean }) => {
  const { missions, isDesktop, isLoggedIn } = props

  const [activeSection, setActiveSection] = useState<MissionType>(MissionType.EXPERIENCE)

  const [sectionInView, isSectionInView] = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (!isSectionInView) {
      setActiveSection(MissionType.EXPERIENCE)
    }
  }, [isSectionInView])

  return (
    <MissionsSection>
      <MissionsContainer ref={sectionInView}>
        {missions.list.map((mission, index) => {
          const id = mission.id as MissionType
          return (
            <Fragment key={`${id}-${index}`}>
              <MissionView id={id} onIsInView={() => setActiveSection(id)} />
              <MissionDetail {...mission} isSectionInView={id === activeSection} isLoggedIn={isLoggedIn} />
              <MissionVideo
                {...mission}
                isSectionInView={id === activeSection}
                eventData={SegmentEvent.MISSIONS_EXPERIENCE}
                isDesktop={isDesktop}
              />
            </Fragment>
          )
        })}
      </MissionsContainer>
    </MissionsSection>
  )
})

export { Missions }
