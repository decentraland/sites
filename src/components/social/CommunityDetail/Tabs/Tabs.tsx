import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { TabsProps } from './Tabs.types'
import { Tab, TabButton, TabText, TabsContainer } from './Tabs.styled'

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
