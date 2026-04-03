import { memo } from 'react'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { ChevronDownIcon, ExternalLinkIcon } from './icons'
import { DROPDOWN_SECTIONS, MENU_CONFIG } from './navbarConfig'
import type { DropdownSection } from './navbarConfig'
import {
  DesktopDropdown,
  DesktopDropdownInner,
  DesktopDropdownItem,
  DesktopDropdownWrapper,
  DesktopTabLink,
  DesktopTabList,
  DesktopTabWithDropdown
} from './LandingNavbar.styled'

interface NavLinksProps {
  desktopDropdown: DropdownSection | null
  onOpenDropdown: (section: DropdownSection) => void
  onScheduleCloseDropdown: () => void
}

const NavLinks = memo(function NavLinks({ desktopDropdown, onOpenDropdown, onScheduleCloseDropdown }: NavLinksProps) {
  const l = useFormatMessage()

  return (
    <DesktopTabList>
      <DesktopTabLink href={MENU_CONFIG.whatsOn.url}>{l(MENU_CONFIG.whatsOn.labelKey)}</DesktopTabLink>

      {DROPDOWN_SECTIONS.map(section => (
        <DesktopDropdownWrapper key={section} onMouseEnter={() => onOpenDropdown(section)} onMouseLeave={onScheduleCloseDropdown}>
          <DesktopTabWithDropdown
            aria-expanded={desktopDropdown === section}
            aria-haspopup="true"
            onClick={() => {
              const firstItem = MENU_CONFIG[section].items?.[0]
              if (firstItem) window.open(firstItem.url, '_self')
            }}
          >
            {l(MENU_CONFIG[section].labelKey)}
            <ChevronDownIcon
              style={{
                transform: desktopDropdown === section ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease'
              }}
            />
          </DesktopTabWithDropdown>

          {desktopDropdown === section && (
            <DesktopDropdown>
              <DesktopDropdownInner>
                {MENU_CONFIG[section].items?.map(item => (
                  <DesktopDropdownItem
                    key={item.labelKey}
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    {l(item.labelKey)}
                    {item.isExternal && <ExternalLinkIcon />}
                  </DesktopDropdownItem>
                ))}
              </DesktopDropdownInner>
            </DesktopDropdown>
          )}
        </DesktopDropdownWrapper>
      ))}
    </DesktopTabList>
  )
})

NavLinks.displayName = 'NavLinks'

export { NavLinks }
