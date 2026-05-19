type TabType = 'members' | 'events'

type TabsProps = {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export type { TabType, TabsProps }
