import { memo, useCallback, useState } from 'react'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from './icons'
import { DROPDOWN_SECTIONS, MENU_CONFIG } from './navbarConfig'
import type { DropdownSection } from './navbarConfig'
import {
  MobileMenuAccordionHeader,
  MobileMenuItem,
  MobileMenuLink,
  MobileMenuOverlay,
  MobileMenuPanel,
  MobileMenuSubItem,
  MobileMenuSubItems
} from './LandingNavbar.styled'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

const MobileMenu = memo(function MobileMenu({ open, onClose }: MobileMenuProps) {
  const l = useFormatMessage()
  const [mobileAccordion, setMobileAccordion] = useState<DropdownSection | null>(null)

  const toggleMobileAccordion = useCallback((section: DropdownSection) => {
    setMobileAccordion(prev => (prev === section ? null : section))
  }, [])

  return (
    <>
      <MobileMenuOverlay open={open} onClick={onClose} />
      <MobileMenuPanel open={open} role="navigation" aria-label="Mobile navigation">
        <MobileMenuItem>
          <MobileMenuLink href={MENU_CONFIG.whatsOn.url}>{l(MENU_CONFIG.whatsOn.labelKey)}</MobileMenuLink>
        </MobileMenuItem>

        {DROPDOWN_SECTIONS.map(section => {
          const config = MENU_CONFIG[section]
          const isExpanded = mobileAccordion === section

          return (
            <MobileMenuItem key={section}>
              <MobileMenuAccordionHeader onClick={() => toggleMobileAccordion(section)} aria-expanded={isExpanded}>
                {l(config.labelKey)}
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </MobileMenuAccordionHeader>

              <MobileMenuSubItems open={isExpanded}>
                {config.items?.map(item => (
                  <MobileMenuSubItem
                    key={item.labelKey}
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    {l(item.labelKey)}
                    {item.isExternal && <ExternalLinkIcon />}
                  </MobileMenuSubItem>
                ))}
              </MobileMenuSubItems>
            </MobileMenuItem>
          )
        })}
      </MobileMenuPanel>
    </>
  )
})

MobileMenu.displayName = 'MobileMenu'

export { MobileMenu }
