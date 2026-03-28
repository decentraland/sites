type InviteMediaAsset = {
  url: string
  mimeType: string
  width: number
  height: number
}

type InviteHeroMedia = {
  imageLandscape: InviteMediaAsset
  imagePortrait: InviteMediaAsset
  videoLandscape?: InviteMediaAsset
  videoPortrait?: InviteMediaAsset
}

const INVITE_HERO_MEDIA: InviteHeroMedia = {
  imageLandscape: {
    url: 'https://images.ctfassets.net/ea2ybdmmn1kv/5bDqAZaeWfjSbEN3fUbtL1/1957872d6b0c0b408d18b0270c6fe12a/TileTexture.png',
    mimeType: 'image/png',
    width: 1024,
    height: 1024
  },
  imagePortrait: {
    url: 'https://images.ctfassets.net/ea2ybdmmn1kv/5bDqAZaeWfjSbEN3fUbtL1/1957872d6b0c0b408d18b0270c6fe12a/TileTexture.png',
    mimeType: 'image/png',
    width: 1024,
    height: 1024
  }
}

const INVITE_SECOND_HERO_MEDIA: InviteHeroMedia = {
  imageLandscape: {
    url: 'https://images.ctfassets.net/ea2ybdmmn1kv/5nMJA8MR99SuGOZjVNBvs5/63eacfdf6d7ab686a2eb8c1f611d13ea/referral_second_hero_background.webp',
    mimeType: 'image/webp',
    width: 1920,
    height: 900
  },
  imagePortrait: {
    url: 'https://images.ctfassets.net/ea2ybdmmn1kv/5nMJA8MR99SuGOZjVNBvs5/63eacfdf6d7ab686a2eb8c1f611d13ea/referral_second_hero_background.webp',
    mimeType: 'image/webp',
    width: 1920,
    height: 900
  },
  videoLandscape: {
    url: 'https://videos.ctfassets.net/ea2ybdmmn1kv/5o1Y3MeLA6NU24w1vGqz3Z/eae85b700c09ba304d3b4db312c7b5da/2025_DCL_Referral_Page_Video_1080x1080.webm',
    mimeType: 'video/webm',
    width: 1080,
    height: 1080
  },
  videoPortrait: {
    url: 'https://videos.ctfassets.net/ea2ybdmmn1kv/5o1Y3MeLA6NU24w1vGqz3Z/eae85b700c09ba304d3b4db312c7b5da/2025_DCL_Referral_Page_Video_1080x1080.webm',
    mimeType: 'video/webm',
    width: 1080,
    height: 1080
  }
}

export { INVITE_HERO_MEDIA, INVITE_SECOND_HERO_MEDIA }
export type { InviteHeroMedia, InviteMediaAsset }
