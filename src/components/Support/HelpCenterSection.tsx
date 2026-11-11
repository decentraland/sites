import { useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { useTranslation } from '@dcl/hooks'
import { dclColors } from 'decentraland-ui2'
import {
  HelpMobileHeader,
  HelpSidebar,
  HelpSidebarDescription,
  HelpSidebarTexts,
  HelpSidebarTitle,
  HelpTabButton,
  HelpTabButtonsContainer,
  MobileStatusWrapper
} from '../../pages/help/HelpPage.styled'
import { FaqIcon, SupportIcon } from '../Icons'
import { StatusDropdown } from './StatusDropdown'
import type { Service } from './utils'

enum HelpTab {
  FAQ = 'faq',
  SUPPORT_UPDATES = 'support updates',
  CREATOR_FUND = 'creator fund'
}

type HelpCenterSectionProps = {
  activeTab: HelpTab
  setTab: (tab: HelpTab) => void
  serviceList: Service[]
}

const HelpCenterSection = ({ activeTab, setTab, serviceList }: HelpCenterSectionProps) => {
  const { t } = useTranslation()

  const handleTabClick = useCallback(
    (tab: HelpTab) => () => {
      setTab(tab)
    },
    [setTab]
  )

  return (
    <HelpSidebar>
      <HelpSidebarTexts>
        <HelpMobileHeader>
          <HelpSidebarTitle variant="h2">{t('component.landing.help.center.title')}</HelpSidebarTitle>
          <MobileStatusWrapper>
            <StatusDropdown serviceList={serviceList} />
          </MobileStatusWrapper>
        </HelpMobileHeader>
        <HelpSidebarDescription>{t('component.landing.help.center.paragraph')}</HelpSidebarDescription>
      </HelpSidebarTexts>
      <HelpTabButtonsContainer>
        <HelpTabButton active={activeTab === HelpTab.FAQ} onClick={handleTabClick(HelpTab.FAQ)}>
          <FaqIcon dark={activeTab === HelpTab.FAQ} />
          {t('component.landing.help.center.faq_button_label')}
        </HelpTabButton>
        <HelpTabButton active={activeTab === HelpTab.CREATOR_FUND} onClick={handleTabClick(HelpTab.CREATOR_FUND)}>
          {/* Same light/dark swap as the FAQ and Support icons. */}
          <TollOutlinedIcon htmlColor={activeTab === HelpTab.CREATOR_FUND ? dclColors.neutral.softBlack1 : dclColors.neutral.softWhite} />
          {t('component.landing.help.center.creator_fund_button_label')}
        </HelpTabButton>
        <HelpTabButton active={activeTab === HelpTab.SUPPORT_UPDATES} onClick={handleTabClick(HelpTab.SUPPORT_UPDATES)}>
          <SupportIcon dark={activeTab === HelpTab.SUPPORT_UPDATES} />
          {t('component.landing.help.center.support_updates_button_label')}
        </HelpTabButton>
      </HelpTabButtonsContainer>
    </HelpSidebar>
  )
}

export { HelpCenterSection, HelpTab }
