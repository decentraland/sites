import { memo, useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MenuIcon from '@mui/icons-material/Menu'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { sectionLinks } from '../data'
import {
  BrandBy,
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
  const toggle = useCallback(() => setIsOpen(open => !open), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <NavHeader>
      <NavBar>
        <BrandLink href="#overview">
          <BrandLogo aria-hidden="true" />
          <BrandText>
            <BrandName>{l('page.creator_fund.nav.brand')}</BrandName>
            <BrandBy>{l('page.creator_fund.nav.by')}</BrandBy>
          </BrandText>
        </BrandLink>
        <DesktopLinks aria-label={l('page.creator_fund.nav.aria_label')}>
          {sectionLinks.map(link => (
            <DesktopLink key={link.id} href={`#${link.id}`}>
              {l(link.labelKey)}
            </DesktopLink>
          ))}
        </DesktopLinks>
        <DesktopCta href="#join">{l('page.creator_fund.cta.join')}</DesktopCta>
        <MenuButton
          type="button"
          aria-label={l(isOpen ? 'page.creator_fund.nav.close_menu' : 'page.creator_fund.nav.open_menu')}
          aria-expanded={isOpen}
          aria-controls={MOBILE_PANEL_ID}
          onClick={toggle}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </MenuButton>
      </NavBar>
      {isOpen && (
        <MobilePanel id={MOBILE_PANEL_ID} aria-label={l('page.creator_fund.nav.aria_label')}>
          <MobileLinks>
            {sectionLinks.map(link => (
              <MobileLink key={link.id} href={`#${link.id}`} onClick={close}>
                {l(link.labelKey)}
              </MobileLink>
            ))}
            <MobileCta href="#join" onClick={close}>
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
