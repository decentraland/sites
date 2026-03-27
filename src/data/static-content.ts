import { assetUrl } from '../utils/assetUrl'

// Hero
const heroContent = {
  title: 'Close the Feed. Come Hang Out.',
  backgroundVideo: assetUrl('/video_landing.mp4')
}

// CatchTheVibe - 2 cards with image + hover video
const catchTheVibeContent = {
  title: 'Catch the Vibe',
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
  title: 'Your Weekly Rituals',
  cards: [
    { id: 'career-mondays', title: 'Career Mondays', imageUrl: assetUrl('/weekly-rituals/career-mondays.webp'), link: '/events' },
    { id: 'takeover-tuesdays', title: 'Takeover Tuesdays', imageUrl: assetUrl('/weekly-rituals/takeover-tuesdays.webp'), link: '/events' },
    { id: 'watch-party', title: 'Watch Party Wednesdays', imageUrl: assetUrl('/weekly-rituals/watch-party.webp'), link: '/events' },
    { id: 'trivia-thursdays', title: 'Trivia Thursdays', imageUrl: assetUrl('/weekly-rituals/trivia-thursdays.webp'), link: '/events' },
    {
      id: 'play-with-friends',
      title: 'Play with Friends Fridays',
      imageUrl: assetUrl('/weekly-rituals/play-with-friends.webp'),
      link: '/events'
    }
  ]
}

export { catchTheVibeContent, heroContent, weeklyRitualsContent }
