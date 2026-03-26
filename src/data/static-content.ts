// Hero
const heroContent = {
  title: 'Close the Feed. Come Hang Out.',
  backgroundVideo: '/video_landing.mp4'
}

// CatchTheVibe - 2 video cards
const catchTheVibeContent = {
  title: 'Catch the Vibe',
  videos: [
    {
      videoUrl: '/videos/catch-vibe-1.mp4',
      userName: 'MetaTiger',
      userAvatarUrl: '/avatars/metatiger.png'
    },
    {
      videoUrl: '/videos/catch-vibe-2.mp4',
      userName: 'PaulRoustan',
      userAvatarUrl: '/avatars/paulroustan.png'
    }
  ]
}

// WeeklyRituals - carousel cards
const weeklyRitualsContent = {
  title: 'Your Weekly Rituals',
  cards: [
    { id: 'career-mondays', title: 'Career Mondays', imageUrl: '/weekly-rituals/career-mondays.webp', link: '/events' },
    { id: 'watch-party', title: 'Watch Party', imageUrl: '/weekly-rituals/watch-party.webp', link: '/events' },
    { id: 'play-with-friends', title: 'Play with Friends', imageUrl: '/weekly-rituals/play-with-friends.webp', link: '/events' },
    { id: 'trivia-thursdays', title: 'Trivia Thursdays', imageUrl: '/weekly-rituals/trivia-thursdays.webp', link: '/events' },
    { id: 'takeover-tuesdays', title: 'Takeover Tuesdays', imageUrl: '/weekly-rituals/takeover-tuesdays.webp', link: '/events' }
  ]
}

export { catchTheVibeContent, heroContent, weeklyRitualsContent }
