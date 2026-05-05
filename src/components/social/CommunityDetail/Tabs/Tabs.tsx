import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { Tab, TabButton, TabText, TabsContainer } from './Tabs.styled'

type TabType = 'members' | 'events'

type TabsProps = {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

function Tabs({ activeTab, onTabChange }: TabsProps) {
  const t = useFormatMessage()
  return (
    <TabsContainer>
      <Tab active={activeTab === 'members'} onClick={() => onTabChange('members')}>
        <TabButton>
          <TabText active={activeTab === 'members'}>{t('community.tabs.members')}</TabText>
        </TabButton>
      </Tab>
      <Tab active={activeTab === 'events'} onClick={() => onTabChange('events')}>
        <TabButton>
          <TabText active={activeTab === 'events'}>{t('community.tabs.upcoming_events')}</TabText>
        </TabButton>
      </Tab>
    </TabsContainer>
  )
}

export { Tabs }
export type { TabType }
