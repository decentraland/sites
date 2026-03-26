// Hero
const heroContent = {
  title: 'Close the Feed. Come Hang Out.',
  backgroundVideo: '/video_landing.mp4'
}

// CatchTheVibe - 2 cards with image + hover video
const catchTheVibeContent = {
  title: 'Catch the Vibe',
  cards: [
    {
      imageUrl: '/catch_the_vibe/alan.png',
      videoUrl: '/catch_the_vibe/alan.mp4',
      userName: 'AlanHowick',
      userAvatarUrl: '/avatar_face.png'
    },
    {
      imageUrl: '/catch_the_vibe/roustan.png',
      videoUrl: '/catch_the_vibe/roustan.mp4',
      userName: 'Roustan',
      userAvatarUrl: '/avatar_face.png'
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
