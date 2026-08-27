import { assetUrl } from '../utils/assetUrl'

// Hero
const heroContent = {
  backgroundVideoWebm: assetUrl('/video_landing.webm'),
  backgroundVideoMp4: assetUrl('/video_landing.mp4')
}

// CatchTheVibe - 2 cards with image + hover video
const catchTheVibeContent = {
  cards: [
    {
      imageUrl: assetUrl('/catch_the_vibe/alan.webp'),
      videoUrl: assetUrl('/catch_the_vibe/alan.mp4'),
      userName: 'AlanHowick',
      userAddress: '0xd82d005e8f8d5385db40ba23884a5c967bb1e8af',
      userAvatarUrl: assetUrl('/avatar_face.webp')
    },
    {
      imageUrl: assetUrl('/catch_the_vibe/roustan.webp'),
      videoUrl: assetUrl('/catch_the_vibe/roustan.mp4'),
      userName: 'Roustan',
      userAddress: '0x54e93609eb454a1f152edefdf022480794ce2130',
      userAvatarUrl: assetUrl('/avatar_face.webp')
    }
  ]
}

// WeeklyRituals - carousel cards
const weeklyRitualsContent = {
  cards: [
    {
      id: 'career-mondays',
      titleKey: 'page.home.weekly_rituals.career_mondays',
      imageUrl: assetUrl('/weekly-rituals/monday.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Monday-Mobile.webp'),
      link: '/events?id=0795dec0-4862-4f19-a4d5-d0f3c3c3b559'
    },
    {
      id: 'takeover-tuesdays',
      titleKey: 'page.home.weekly_rituals.takeover_tuesdays',
      imageUrl: assetUrl('/weekly-rituals/tuesday.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Tuesday-Mobile.webp'),
      link: '/events?id=efc2bf0f-bf0d-447a-82a2-fe7a5650ca19'
    },
    {
      id: 'watch-party',
      titleKey: 'page.home.weekly_rituals.watch_party_wednesdays',
      imageUrl: assetUrl('/weekly-rituals/wednesday.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Wednesday-Mobile.webp'),
      link: '/events?id=e22333e4-4277-4b59-b99b-ba3174e1dd29'
    }
  ]
}

export { catchTheVibeContent, heroContent, weeklyRitualsContent }
