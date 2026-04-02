import { assetUrl } from '../../../utils/assetUrl'

const GOOGLE_PLAY_MOBILE_URL =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&pcampaignid=web_share&utm_source=dcl_foundation&utm_medium=internal&utm_campaign=mobile_launch&utm_content=android&pli=1'

const GOOGLE_PLAY_DESKTOP_URL =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&pcampaignid=web_share&utm_source=partners&utm_medium=pr&utm_campaign=mobile_launch&utm_content=android'

const googlePlayBadge = assetUrl('/google_play_cta.svg')

export { GOOGLE_PLAY_DESKTOP_URL, GOOGLE_PLAY_MOBILE_URL, googlePlayBadge }
