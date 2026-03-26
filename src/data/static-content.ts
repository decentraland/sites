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
      imageUrl: assetUrl('/catch_the_vibe/alan.png'),
      videoUrl: assetUrl('/catch_the_vibe/alan.mp4'),
      userName: 'AlanHowick',
      userAvatarUrl: assetUrl('/avatar_face.png')
    },
    {
      imageUrl: assetUrl('/catch_the_vibe/roustan.png'),
      videoUrl: assetUrl('/catch_the_vibe/roustan.mp4'),
      userName: 'Roustan',
      userAvatarUrl: assetUrl('/avatar_face.png')
    }
  ]
}

// WeeklyRituals - carousel cards
const weeklyRitualsContent = {
  title: 'Your Weekly Rituals',
  cards: [
    { id: 'career-mondays', title: 'Career Mondays', imageUrl: assetUrl('/weekly-rituals/career-mondays.webp'), link: '/events' },
    { id: 'watch-party', title: 'Watch Party', imageUrl: assetUrl('/weekly-rituals/watch-party.webp'), link: '/events' },
    { id: 'play-with-friends', title: 'Play with Friends', imageUrl: assetUrl('/weekly-rituals/play-with-friends.webp'), link: '/events' },
    { id: 'trivia-thursdays', title: 'Trivia Thursdays', imageUrl: assetUrl('/weekly-rituals/trivia-thursdays.webp'), link: '/events' },
    { id: 'takeover-tuesdays', title: 'Takeover Tuesdays', imageUrl: assetUrl('/weekly-rituals/takeover-tuesdays.webp'), link: '/events' }
  ]
}

export { catchTheVibeContent, heroContent, weeklyRitualsContent }
