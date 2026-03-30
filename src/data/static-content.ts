import { assetUrl } from '../utils/assetUrl'

// Hero
const heroContent = {
  backgroundVideo: assetUrl('/video_landing.mp4')
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
      imageUrl: assetUrl('/weekly-rituals/career-mondays.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Monday-Mobile.webp'),
      link: '/events'
    },
    {
      id: 'takeover-tuesdays',
      titleKey: 'page.home.weekly_rituals.takeover_tuesdays',
      imageUrl: assetUrl('/weekly-rituals/takeover-tuesdays.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Tuesday-Mobile.webp'),
      link: '/events'
    },
    {
      id: 'watch-party',
      titleKey: 'page.home.weekly_rituals.watch_party_wednesdays',
      imageUrl: assetUrl('/weekly-rituals/watch-party.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Wednesday-Mobile.webp'),
      link: '/events'
    },
    {
      id: 'trivia-thursdays',
      titleKey: 'page.home.weekly_rituals.trivia_thursdays',
      imageUrl: assetUrl('/weekly-rituals/trivia-thursdays.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Thursday-Mobile.webp'),
      link: '/events'
    },
    {
      id: 'play-with-friends',
      titleKey: 'page.home.weekly_rituals.play_with_friends_fridays',
      imageUrl: assetUrl('/weekly-rituals/play-with-friends.webp'),
      mobileImageUrl: assetUrl('/weekly-rituals/mobile/Fridays-Mobile.webp'),
      link: '/events'
    }
  ]
}

export { catchTheVibeContent, heroContent, weeklyRitualsContent }
