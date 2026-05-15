// eslint-disable-next-line @typescript-eslint/naming-convention
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined'
import type { ProfileTab } from '../ProfileTabs'

// Mobile drawer tab leading icons per Figma node `167:85610`.
// Map keyed via `Map` constructor so we don't trigger the `naming-convention` rule against
// the snake_case `referral-rewards` key the way an object literal would.
const TAB_ICONS = new Map<ProfileTab, React.ComponentType<{ fontSize?: 'small' | 'medium' | 'large' }>>([
  ['overview', PersonOutlinedIcon],
  ['assets', WorkOutlineOutlinedIcon],
  ['creations', BrushOutlinedIcon],
  ['communities', GroupsOutlinedIcon],
  ['places', LandscapeOutlinedIcon],
  ['photos', PhotoOutlinedIcon],
  ['referral-rewards', CardGiftcardOutlinedIcon]
])

export { TAB_ICONS }
