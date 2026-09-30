import { useCallback } from 'react'
import type { MouseEvent } from 'react'
// Deep import, not the barrel: the barrel pulls ProfileModal itself, whose
// identity chain reaches `import.meta` config and so cannot be parsed by Jest.
import { useOpenProfileModal } from '../../profile/ProfileModal/useOpenProfileModal'
import { CreatorLink, CreatorName } from './CreatorByLineName.styled'

interface CreatorByLineNameProps {
  name: string
  // The wallet whose profile the name opens. Places that only declare a
  // free-text contact resolve none, and then the name stays plain text — a
  // control that opens nothing is worse than no control.
  address?: string
  // True while the card has traded its by-line for the JUMP IN CTA. The row is
  // then transparent and pointer-blocked, so the control has to leave the tab
  // order too or focus lands on something nobody can see.
  inactive?: boolean
}

// The creator name in a card by-line. Cards are clickable as a whole, so the
// click has to stop here or opening a profile would also navigate into the
// scene.
function CreatorByLineName({ name, address, inactive }: CreatorByLineNameProps) {
  const openProfile = useOpenProfileModal()

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      if (address) openProfile(address)
    },
    [address, openProfile]
  )

  if (!address) return <CreatorName>{name}</CreatorName>

  return (
    <CreatorLink type="button" tabIndex={inactive ? -1 : 0} onClick={handleClick}>
      {name}
    </CreatorLink>
  )
}

export { CreatorByLineName }
