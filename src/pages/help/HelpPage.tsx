import { useState } from 'react'
import { Intercom } from '../../components/Intercom'
import { FAQSection, HelpCenterSection, HelpTab, StatusDropdown, SupportUpdatesSection } from '../../components/Support'
import { DesktopStatusWrapper, HelpContentArea, HelpPageContainer } from './HelpPage.styled'

const INTERCOM_APP_ID = 'z0h94kay'
const INTERCOM_SETTINGS = { alignment: 'right' } as const

const SERVICES = [
  { name: 'Catalyst EC1', url: 'https://peer-ec1.decentraland.org/about' },
  { name: 'Catalyst Interconnected', url: 'https://interconnected.online/about' },
  { name: 'Catalyst Melonwave', url: 'https://peer.melonwave.com/about' },
  { name: 'Catalyst Kyllian', url: 'https://peer.kyllian.me/about' },
  { name: 'Catalyst UADevops', url: 'https://peer.uadevops.com/about' },
  { name: 'Catalyst DCLNodes', url: 'https://peer.dclnodes.io/about' },
  { name: 'Catalyst AP1', url: 'https://peer-ap1.decentraland.org/about' },
  { name: 'Catalyst EU1', url: 'https://peer-eu1.decentraland.org/about' },
  { name: 'Marketplace', url: 'https://marketplace-api.decentraland.org/ping' },
  { name: 'Chat', url: 'https://peer-ec2.decentraland.org/about' },
  { name: 'Builder', url: 'https://builder-api.decentraland.org/v1/info' },
  { name: 'Places', url: 'https://places.decentraland.org/api/status' },
  { name: 'Events', url: 'https://events.decentraland.org/api/status' }
]

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState(HelpTab.FAQ)

  return (
    <>
      <HelpPageContainer>
        <HelpCenterSection activeTab={activeTab} setTab={setActiveTab} serviceList={SERVICES} />
        <HelpContentArea>
          <FAQSection isActive={activeTab === HelpTab.FAQ} />
          <SupportUpdatesSection isActive={activeTab === HelpTab.SUPPORT_UPDATES} />
        </HelpContentArea>
        <DesktopStatusWrapper>
          <StatusDropdown serviceList={SERVICES} />
        </DesktopStatusWrapper>
      </HelpPageContainer>
      <Intercom appId={INTERCOM_APP_ID} settings={INTERCOM_SETTINGS} />
    </>
  )
}

export { HelpPage }
