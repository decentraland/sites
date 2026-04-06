import type { DropdownSection } from '../navbarConfig'

export interface NavLinksProps {
  desktopDropdown: DropdownSection | null
  onOpenDropdown: (section: DropdownSection) => void
  onScheduleCloseDropdown: () => void
}
