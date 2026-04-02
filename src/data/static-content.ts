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
      link: 'https://decentraland.org/jump/events/?id=746dc03a-649e-4874-ba32-c981bc8aecba'
    },
    {
      id: 'takeover-tuesdays',
      titleKey: 'page.home.weekly_rituals.takeover_tuesdays',
      imageUrl: assetUrl('/weekly-rituals/tuesday.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Tuesday-Mobile.webp'),
      link: 'https://decentraland.org/jump/events/?id=b9e88cf1-aa51-43f4-a00c-368aab1c5e46'
    },
    {
      id: 'watch-party',
      titleKey: 'page.home.weekly_rituals.watch_party_wednesdays',
      imageUrl: assetUrl('/weekly-rituals/wednesday.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Wednesday-Mobile.webp'),
      link: 'https://decentraland.org/jump/events/?id=2391f98b-c70c-4ddc-9bfd-cecf3019d3f6'
    }
  ]
}

export { catchTheVibeContent, heroContent, weeklyRitualsContent }
