import type { Avatar } from '@dcl/schemas'

type ExploreEvent = {
  id: string
  title: string
  image: string
  sceneName: string
  creatorName: string
  creatorAvatar?: Avatar
  startTime: string
  isLive: boolean
  userCount: number
  coordinates: string
}

const PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/dcl1/400/250',
  'https://picsum.photos/seed/dcl2/400/250',
  'https://picsum.photos/seed/dcl3/400/250',
  'https://picsum.photos/seed/dcl4/400/250',
  'https://picsum.photos/seed/dcl5/400/250'
]

function getImage(index: number): string {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]
}

function mockAvatar(name: string): Avatar {
  return {
    name,
    ethAddress: '0x0000000000000000000000000000000000000000',
    hasClaimedName: true,
    userId: '0x0000000000000000000000000000000000000000'
  } as Avatar
}

function futureTime(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60000).toISOString()
}

function getMockLiveEvents(): ExploreEvent[] {
  return [
    {
      id: 'live-1',
      title: "Stoney Eye's MO FYAH MONDAYS",
      image: getImage(0),
      sceneName: 'casa Roustan!',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: new Date().toISOString(),
      isLive: true,
      userCount: 24,
      coordinates: '-110,-40'
    },
    {
      id: 'live-2',
      title: 'MO FYAH!',
      image: getImage(1),
      sceneName: 'Music District',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: new Date().toISOString(),
      isLive: true,
      userCount: 45,
      coordinates: '52,2'
    },
    {
      id: 'live-3',
      title: 'SheFi Summit',
      image: getImage(2),
      sceneName: 'SheFi HQ',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: new Date().toISOString(),
      isLive: true,
      userCount: 89,
      coordinates: '24,10'
    },
    {
      id: 'live-4',
      title: 'Art Gallery Opening Night',
      image: getImage(1),
      sceneName: 'Gallery District',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: new Date().toISOString(),
      isLive: true,
      userCount: 31,
      coordinates: '-5,20'
    }
  ]
}

function getMockUpcomingEvents(): ExploreEvent[] {
  return [
    {
      id: 'upcoming-1',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(0),
      sceneName: 'casa Roustan!',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(10),
      isLive: false,
      userCount: 0,
      coordinates: '-110,-40'
    },
    {
      id: 'upcoming-2',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(1),
      sceneName: 'Music Hall',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(10),
      isLive: false,
      userCount: 0,
      coordinates: '52,2'
    },
    {
      id: 'upcoming-3',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(2),
      sceneName: 'Party Zone',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(30),
      isLive: false,
      userCount: 0,
      coordinates: '24,10'
    },
    {
      id: 'upcoming-4',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(0),
      sceneName: 'Dance Floor',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(10),
      isLive: false,
      userCount: 0,
      coordinates: '-5,20'
    },
    {
      id: 'upcoming-5',
      title: "Disney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(1),
      sceneName: 'Stage Area',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(120),
      isLive: false,
      userCount: 0,
      coordinates: '100,50'
    },
    {
      id: 'upcoming-6',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(2),
      sceneName: 'casa Roustan!',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(10),
      isLive: false,
      userCount: 0,
      coordinates: '-110,-40'
    },
    {
      id: 'upcoming-7',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(0),
      sceneName: 'Music Hall',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(10),
      isLive: false,
      userCount: 0,
      coordinates: '52,2'
    },
    {
      id: 'upcoming-8',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(1),
      sceneName: 'Party Zone',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(180),
      isLive: false,
      userCount: 0,
      coordinates: '24,10'
    },
    {
      id: 'upcoming-9',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(2),
      sceneName: 'Dance Floor',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(240),
      isLive: false,
      userCount: 0,
      coordinates: '-5,20'
    },
    {
      id: 'upcoming-10',
      title: "Stoney Eye's MO FYAH MONDAYS at casa Roustan!",
      image: getImage(0),
      sceneName: 'Stage Area',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: futureTime(300),
      isLive: false,
      userCount: 0,
      coordinates: '100,50'
    }
  ]
}

function generateDayEvents(dayOffset: number, count: number): ExploreEvent[] {
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + dayOffset)
  baseDate.setHours(14, 0, 0, 0)

  const titles = [
    'Event Title / Scene Name',
    'MO FYAH!',
    'SheFi Summit',
    'Art Gallery Opening',
    'Dance Party',
    'Music Festival',
    'NFT Drop Event',
    'Community Meetup',
    'Virtual Concert',
    'Fashion Show',
    'Game Night',
    'Poetry Slam',
    'DJ Battle',
    'Trivia Night',
    'Open Mic'
  ]

  return Array.from({ length: count }, (_, i) => {
    const eventDate = new Date(baseDate)
    eventDate.setHours(14 + Math.floor(i / 3), (i % 3) * 20, 0, 0)

    return {
      id: `exp-${dayOffset}-${i}`,
      title: titles[i % titles.length],
      image: getImage(i),
      sceneName: 'Scene Name',
      creatorName: 'Soul Magic',
      creatorAvatar: mockAvatar('Soul Magic'),
      startTime: eventDate.toISOString(),
      isLive: dayOffset === 0 && i < 2,
      userCount: dayOffset === 0 && i < 2 ? 24 + i * 15 : 0,
      coordinates: `${-50 + i * 10},${20 - i * 5}`
    }
  })
}

function getMockAllExperiences(): Record<number, ExploreEvent[]> {
  return Object.fromEntries([3, 3, 3, 2, 3, 2, 3, 1, 3, 2].map((count, day) => [day, generateDayEvents(day, count)])) as Record<
    number,
    ExploreEvent[]
  >
}

export { getMockAllExperiences, getMockLiveEvents, getMockUpcomingEvents }
export type { ExploreEvent }
