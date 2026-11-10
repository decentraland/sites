import { type MouseEvent, memo, useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MenuIcon from '@mui/icons-material/Menu'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import { DownloadTarget } from '../../../modules/segment'
import { clickTrackingAttributes } from '../CreatorFund.helpers'
import { CLICK_SECTIONS, CREATOR_FUND_RULES_URL, CREATOR_FUND_TERMS_URL, CREATOR_HUB_DOWNLOAD_PATH, sectionLinks } from '../data'
import {
  Brand,
  BrandBy,
  BrandHomeLink,
  BrandLink,
  BrandLogo,
  BrandName,
  BrandText,
  DesktopCta,
  DesktopLink,
  DesktopLinks,
  MenuButton,
  MobileCta,
  MobileLink,
  MobileLinks,
  MobilePanel,
  NavBar,
  NavHeader
} from './SectionNav.styled'

const MOBILE_PANEL_ID = 'creator-fund-section-menu'

const SectionNav = memo(() => {
  const l = useFormatMessage()
  const [isOpen, setIsOpen] = useState(false)
  const trackClick = useUnloadSafeTrackClick()
  const toggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      trackClick(event)
      setIsOpen(open => !open)
    },
    [trackClick]
  )
  // Mobile panel links close the menu after recording the click.
  const trackAndClose = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      trackClick(event)
      setIsOpen(false)
    },
    [trackClick]
  )
  const { navbar, navbarMenu } = CLICK_SECTIONS

  return (
    <NavHeader>
      <NavBar>
        <Brand>
          <BrandHomeLink
            href="/"
            aria-label={l('page.creator_fund.why.visit')}
            {...clickTrackingAttributes(navbar, 'Decentraland Logo')}
            onClick={trackClick}
          >
            <BrandLogo aria-hidden="true" />
          </BrandHomeLink>
          <BrandLink href="#overview" {...clickTrackingAttributes(navbar, 'Creator Fund Name')} onClick={trackClick}>
            <BrandText>
              <BrandName>{l('page.creator_fund.nav.brand')}</BrandName>
              <BrandBy>{l('page.creator_fund.nav.by')}</BrandBy>
            </BrandText>
          </BrandLink>
        </Brand>
        <DesktopLinks aria-label={l('page.creator_fund.nav.aria_label')}>
          {sectionLinks.map(link => (
            <DesktopLink key={link.id} href={`#${link.id}`} {...clickTrackingAttributes(navbar, link.trackingName)} onClick={trackClick}>
              {l(link.labelKey)}
            </DesktopLink>
          ))}
          <DesktopLink
            href={CREATOR_FUND_RULES_URL}
            target="_blank"
            rel="noopener noreferrer"
            {...clickTrackingAttributes(navbar, 'Rules')}
            onClick={trackClick}
          >
            {l('page.creator_fund.nav.rules')}
          </DesktopLink>
          <DesktopLink
            href={CREATOR_FUND_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            {...clickTrackingAttributes(navbar, 'Terms')}
            onClick={trackClick}
          >
            {l('page.creator_fund.nav.terms')}
          </DesktopLink>
        </DesktopLinks>
        <DesktopCta
          href={CREATOR_HUB_DOWNLOAD_PATH}
          {...clickTrackingAttributes(navbar, 'Join From Creator Hub', DownloadTarget.CREATOR_HUB)}
          onClick={trackClick}
        >
          {l('page.creator_fund.cta.join')}
        </DesktopCta>
        <MenuButton
          type="button"
          aria-label={l(isOpen ? 'page.creator_fund.nav.close_menu' : 'page.creator_fund.nav.open_menu')}
          aria-expanded={isOpen}
          aria-controls={MOBILE_PANEL_ID}
          {...clickTrackingAttributes(navbar, isOpen ? 'Close Menu' : 'Open Menu')}
          onClick={toggle}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </MenuButton>
      </NavBar>
      {isOpen && (
        <MobilePanel id={MOBILE_PANEL_ID} aria-label={l('page.creator_fund.nav.aria_label')}>
          <MobileLinks>
            {sectionLinks.map(link => (
              <MobileLink
                key={link.id}
                href={`#${link.id}`}
                {...clickTrackingAttributes(navbarMenu, link.trackingName)}
                onClick={trackAndClose}
              >
                {l(link.labelKey)}
              </MobileLink>
            ))}
            <MobileLink
              href={CREATOR_FUND_RULES_URL}
              target="_blank"
              rel="noopener noreferrer"
              {...clickTrackingAttributes(navbarMenu, 'Rules')}
              onClick={trackAndClose}
            >
              {l('page.creator_fund.nav.rules')}
            </MobileLink>
            <MobileLink
              href={CREATOR_FUND_TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              {...clickTrackingAttributes(navbarMenu, 'Terms')}
              onClick={trackAndClose}
            >
              {l('page.creator_fund.nav.terms')}
            </MobileLink>
            <MobileCta
              href={CREATOR_HUB_DOWNLOAD_PATH}
              {...clickTrackingAttributes(navbarMenu, 'Join From Creator Hub', DownloadTarget.CREATOR_HUB)}
              onClick={trackAndClose}
            >
              {l('page.creator_fund.cta.join')}
            </MobileCta>
          </MobileLinks>
        </MobilePanel>
      )}
    </NavHeader>
  )
})

SectionNav.displayName = 'SectionNav'

export { SectionNav }
